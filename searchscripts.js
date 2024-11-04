document.addEventListener('DOMContentLoaded', () => {
    const SearchButton = document.getElementById('SearchButton');
    const TicketID = document.getElementById('TicketID');

    function formatDate(unixTimestamp) {
        const date = new Date(unixTimestamp * 1000);
        return date.toLocaleString();
    }

    SearchButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const response = await fetch(`https://tickets.sourketchup.workers.dev/tickets/search/${TicketID.value}`, {
            method: 'GET',
        });

        const data = await response.json();
        document.getElementById('ticketTypeResult').textContent = data.Ticket_Type;
        document.querySelector('#studentNameResult span').textContent = data.Owner;

        if (data.Ticket_Type === 'Guest') {
            const response2 = await fetch(`https://tickets.sourketchup.workers.dev/students/${data.Inviter}`, {
                method: 'GET',
            });
            const inviterData = await response2.json();

            document.querySelector('#gradeLevelResult').textContent = `Inviter: ${inviterData.StudentFirstName + ' ' + inviterData.StudentLastName || 'N/A'}`;
        } else {
            const roundedGradeLevel = Math.round(data.GradeLevel);
            document.querySelector('#gradeLevelResult').textContent = `Grade Level: ${roundedGradeLevel || 'N/A'}`;
        }

        const formattedDate = formatDate(data.Time_Added);
        document.querySelector('#timeAddedResult span').textContent = formattedDate;
    });
});
