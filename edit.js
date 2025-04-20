$(document).ready(function() {
    const notyf = new Notyf({
      types: [
        {
          type: 'info',
          background: '#0c4eb1',
          icon: true
        },
        {
          type: 'error',
          background: '#b10c0c',
          icon: true
        }
      ]
    });
  
    const TicketID = $('#ticketSearch');

    
    // Prevent page refresh when clicking the input field
    TicketID.on('click', function(event) {
      event.preventDefault();
      $(this).val(''); // Clear the field
    });
  
    // Function to search for ticket when user submits the form
    async function searchTicket(event) {
      event.preventDefault(); // Prevent form submission from refreshing the page
      
      const ticketNumber = TicketID.val()
      if (!ticketNumber) {
        notyf.open({
          type: 'error',
          message: 'Please enter a ticket number.',
          icon: '<i class="fas fa-times-circle"></i>'
        });
        return;
      }
  
      try {
        const response = await fetch(`https://tickets.sourketchup.workers.dev/tickets/search/${ticketNumber}`);
        if (!response.ok) {
          notyf.open({
            type: 'error',
            message: 'Ticket not found.',
            icon: '<i class="fas fa-times-circle"></i>'
          });
          return;
        }
        notyf.open({
          type: 'info',
          message: 'Ticket found!',
          icon: '<i class="fas fa-check-circle"></i>'
        });
  
        const data = await response.json();
        const studentFields = document.getElementById('studentFields');
        const guestFields = document.getElementById('guestFields');
        console.log(data);
        const ticketType = data.Ticket_Type?.toLowerCase(); // normalize case
        if (ticketType === "student") {
            $('#studentFields').removeClass('hidden');
            $('#guestFields').addClass('hidden');
          
            $('#studentName').val(data.Owner || '');
            $('#gradeLevel').val(data.GradeLevel || '');
            $('#ticketNumber').val(data.ID || '');
            $('#ticketType').val('Student');
          } else if (ticketType === "guest") {
            $('#guestFields').removeClass('hidden');
            $('#studentFields').addClass('hidden');
          
            $('#guestName').val(data.Owner || '');
            $('#guestGrade').val(data.GradeLevel || '');
            $('#inviter').val(data.Inviter || '');
            $('#ticketNumber').val(data.ID || '');
            $('#ticketType').val('Guest');
          } else {
            console.log("Unknown ticket type:", ticketType);
          }
      } catch (error) {
        notyf.open({
          type: 'error',
          message: 'An error occurred. Please try again later.',
          icon: '<i class="fas fa-times-circle"></i>'
        });
      }
    }
  
    // Bind the form submit event to searchTicket function
    $('#editSearchForm').on('submit', searchTicket);
  
    // Alternatively, if you have a search button, you can bind the click event
    $('#searchButton').on('click', searchTicket);
  });
  