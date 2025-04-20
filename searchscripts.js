document.addEventListener('DOMContentLoaded', () => {
    const SearchButton = document.getElementById('SearchButton');
    const TicketID = document.getElementById('TicketID');
    const notyf = new Notyf({
        types: [
          {
            type: 'info',
            background: '#0c4eb1',
            icon: true
          }
        ,{
            type: 'error',
            background: '#b10c0c',
            icon: true
          }
        ]
      });
    
    if (!SearchButton || !TicketID) return;

    function formatDate(unixTimestamp) {
        const date = new Date(unixTimestamp * 1000);
        return date.toLocaleString();
    }

    SearchButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const response = await fetch(`https://tickets.sourketchup.workers.dev/tickets/search/${TicketID.value}`);
        const data = await response.json();

        if (!response.ok) {
            notyf.open({
                type: 'error',
                message: data.error,
                icon: '<i class="fas fa-times-circle"></i>'
            });
            return;
        }

        notyf.open({
            type: 'info',
            message: 'Ticket found!',
            icon: '<i class="fas fa-check-circle"></i>'
        });

        const ticketTypeEl = document.getElementById('ticketTypeResult');
        const studentNameEl = document.getElementById('studentNameResult');
        const gradeLevelEl = document.getElementById('gradeLevelResult');
        const timeAddedEl = document.getElementById('timeAddedResult');
        const checkinButton = document.getElementById('checkinButton');

        if (!ticketTypeEl || !studentNameEl || !gradeLevelEl || !timeAddedEl) return;

        ticketTypeEl.textContent = data.Ticket_Type;
        studentNameEl.textContent = data.Owner;
        console.log(data);

        if (data.Checked_In === "0") {
            checkinButton.textContent = 'Check In';
            checkinButton.onclick = async () => {
                const response = await fetch(`https://tickets.sourketchup.workers.dev/tickets/checkin/${data.ID}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });
                if (!response.ok) {
                    notyf.open({
                        type: 'error',
                        message: 'Something went wrong!',
                        icon: '<i class="fas fa-times-circle"></i>'
                    });
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                notyf.open({
                    type: 'info',
                    message: 'Checked in successfully!',
                    icon: '<i class="fas fa-check-circle"></i>'
                });
                checkinButton.textContent = 'Checked In';
                checkinButton.disabled = true;
            };
        } else if (data.Checked_In === "1") {
            checkinButton.textContent = 'Checked In';
            checkinButton.disabled = true;
        }

        if (data.Ticket_Type === 'Guest') {
            const response2 = await fetch(`https://tickets.sourketchup.workers.dev/students/${data.Inviter}`);
            const inviterData = await response2.json();
            gradeLevelEl.style.display = 'block'; // Show the grade level element for guest tickets
            gradeLevelEl.textContent = `Inviter: ${inviterData.StudentFirstName + ' ' + inviterData.StudentLastName || 'N/A'}`;
        } else {
            gradeLevelEl.style.display = 'none'; // Hide the grade level element if not a guest ticket
        }
        document.getElementById('searchResults').style.display = 'block';

        timeAddedEl.textContent = formatDate(data.Time_Added);
    });
});
