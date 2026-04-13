$(document).ready(function () {
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

  const apiBase = 'https://tickets.sourketchup.workers.dev';
  const ticketSearch = $('#ticketSearch');
  const editForm = $('#editForm');
  const editSearchForm = $('#editSearchForm');
  const ticketType = $('#ticketType');
  const studentFields = $('#studentFields');
  const guestFields = $('#guestFields');
  const studentName = $('#studentName');
  const guestName = $('#guestName');
  const guestGrade = $('#guestGrade');
  const inviter = $('#inviter');
  const ticketNumber = $('#ticketNumber');

  let currentTicketId = null;

  function showError(message) {
    notyf.open({
      type: 'error',
      message,
      icon: '<i class="fas fa-times-circle"></i>'
    });
  }

  function showInfo(message) {
    notyf.open({
      type: 'info',
      message,
      icon: '<i class="fas fa-check-circle"></i>'
    });
  }

  function toggleFields(type) {
    if (type === 'Guest') {
      guestFields.removeClass('hidden');
      studentFields.addClass('hidden');
    } else {
      studentFields.removeClass('hidden');
      guestFields.addClass('hidden');
    }
  }

  function populateForm(data) {
    const normalizedType = (data.Ticket_Type || '').toLowerCase();
    const resolvedType = normalizedType === 'guest' ? 'Guest' : 'Student';

    currentTicketId = data.ID || ticketSearch.val().trim();
    ticketSearch.val(currentTicketId);
    ticketType.val(resolvedType);
    ticketNumber.val(data.ID || '');

    studentName.val('');
    guestName.val('');
    guestGrade.val('');
    inviter.val('');

    toggleFields(resolvedType);

    if (resolvedType === 'Guest') {
      guestName.val(data.Owner || '');
      guestGrade.val(data.GradeLevel || '');
      inviter.val(data.Inviter || '');
    } else {
      studentName.val(data.Owner || '');
    }
  }

  async function searchTicket(event) {
    event.preventDefault();

    const searchedTicketId = ticketSearch.val().trim();
    if (!searchedTicketId) {
      showError('Please enter a ticket number.');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/tickets/search/${searchedTicketId}`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        showError(data?.error || 'Ticket not found.');
        return;
      }

      populateForm(data);
      showInfo('Ticket found!');
    } catch (error) {
      console.error('Search error:', error);
      showError('An error occurred while searching for the ticket.');
    }
  }

  async function updateTicket(event) {
    event.preventDefault();

    const originalId = currentTicketId || ticketSearch.val().trim();
    const updatedId = ticketNumber.val().trim();
    const type = ticketType.val();

    if (!originalId) {
      showError('Search for a ticket before updating it.');
      return;
    }

    if (!updatedId) {
      showError('Ticket number is required.');
      return;
    }

    const payload = {
      Ticket_Type: type,
      Inviter: type === 'Guest' ? inviter.val().trim() : 'NONE',
      Owner: type === 'Guest' ? guestName.val().trim().toUpperCase() : studentName.val().trim().toUpperCase(),
      GradeLevel: type === 'Guest' ? (guestGrade.val().trim() || null) : null
    };

    if (!payload.Owner) {
      showError(type === 'Guest' ? 'Guest name is required.' : 'Student name is required.');
      return;
    }

    if (type === 'Guest' && !payload.Inviter) {
      showError('Inviter is required for guest tickets.');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/tickets/edit/${originalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        showError(data?.error || 'Unable to update ticket.');
        return;
      }

      currentTicketId = updatedId;
      ticketSearch.val(updatedId);
      showInfo('Ticket updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      showError('An error occurred while updating the ticket.');
    }
  }

  editSearchForm.on('submit', searchTicket);
  editForm.on('submit', updateTicket);
  ticketType.on('change', function () {
    toggleFields($(this).val());
  });
});

