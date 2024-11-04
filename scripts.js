document.addEventListener('DOMContentLoaded', () => {
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const studentSubmission = document.getElementById('StudentSubmission');
    const guestSubmission = document.getElementById('GuestSubmission');
    const tickettypealert = document.getElementById('tickettypealert');
    const verifyStudentButton = document.getElementById('verifyStudentButton');
    const ticketbox = document.getElementById('ticket-box');
    const studentNumberInput = document.getElementById('studentNumber');
    const studentheader = document.getElementById('studentheader');
    const ticketnumberInput = document.getElementById('studentticketNumber');
    const ticketsubmit = document.getElementById('ticketSubmit');
    let data
    
    async function handleStudentForm() {
        const studentNumberInput = document.getElementById('studentNumber');
        
        try {
            const response = await fetch(`https://tickets.sourketchup.workers.dev/students/${studentNumberInput.value}`, {
                method: 'GET',
            });

            if (!response.ok) {
                if (response.status === 404) {
                    alert('Student not found.');
                    return;
                } 
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            verifyStudentButton.style.display = 'none';
            studentNumberInput.style.display = 'none';
            studentheader.style.display = 'none';
            data = await response.json(); // Await here to get the parsed JSON data
            const studentName = document.createElement('h2');
            studentName.id ='studentName';
            studentName.textContent = `${data.StudentFirstName} ${data.StudentLastName}`;
            
            const homeroomTeacher = document.createElement('p');
            homeroomTeacher.id = 'homeroomTeacher';
            homeroomTeacher.textContent = `Homeroom Teacher: ${data.HomeroomTeacher}`;
            
            const gradeLevel = document.createElement('p');
            gradeLevel.id = 'gradeLevel';
            gradeLevel.textContent = `Grade Level: ${data.GradeLevel}`;
    
            // Append the elements to the studentSubmission box
            studentSubmission.appendChild(studentName);
            studentSubmission.appendChild(homeroomTeacher);
            studentSubmission.appendChild(gradeLevel);
    
            // Show the ticket box
            ticketbox.style.display = 'block';
            ticketsubmit.addEventListener('click', function(event) {
                event.preventDefault();
                if (!ticketnumberInput.value) {
                    alert('Please enter a ticket number.');
                    return;
                }
                addStudentTicket(ticketnumberInput.value, data);
            });
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }
    async function addStudentTicket(ticketNumber, data) {
        try {
            const firstname = data.StudentFirstName.toLowerCase();
            const lastname = data.StudentLastName.toLowerCase();
            const name = `${firstname} ${lastname}`.toUpperCase();

            const response = await fetch(`https://proxy.wyzie.ru/https://tickets.sourketchup.workers.dev/tickets/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ID: ticketNumber,          // Assuming ticketNumber is the ID
                    Ticket_Type: "Student",   // e.g., "Guest" or "Student"
                    Inviter: "NONE",          // The StudentID or GuestID
                    Owner: name,              // The name or ID of the owner
                    GradeLevel: data.GradeLevel           // Pass null if no grade level is needed
                }),
            });
    
            if (!response.ok) {
                if (response.status === 403) {
                    alert('A ticket with this ID already exists. Please use a different ID.');
                    return;
                } 
                const errorData = await response.json();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error}`);
            }
    
            const responsedata = await response.json();
            alert(`Ticket ${ticketNumber} added successfully!`);
            studentSubmission.style.display = 'block';
            guestSubmission.style.display = 'none';
            verifyStudentButton.style.display = 'block';
            studentNumberInput.style.display = 'block';
            studentheader.style.display = 'block';
            ticketbox.style.display = 'none';
            const studentName = document.getElementById('studentName');
            const homeroomTeacher = document.getElementById('homeroomTeacher');
            const gradeLevel = document.getElementById('gradeLevel');
            studentName.remove();
            homeroomTeacher.remove();
            gradeLevel.remove();
        } catch (error) {
            console.error('Error:', error);
        }
    }
    async function handleGuestForm() {
        const firstname = document.getElementById('firstName').value;
        const lastname = document.getElementById('lastName').value;
        const inviterID = document.getElementById('inviterID').value;
        const ticketNumber = document.getElementById('ticketNumber').value;
        const name = `${firstname} ${lastname}`.toUpperCase();
        if (!firstname ||!lastname ||!inviterID ||!ticketNumber) {
            alert('Please fill in all required fields.');
            return;
        }
        const data = {firstname, lastname, inviterID, ticketNumber, name};
        await addGuestTicket(ticketNumber, data);
        
    }
    async function addGuestTicket(ticketNumber, data) {
        try {
            const response = await fetch(`https://proxy.wyzie.ru/https://tickets.sourketchup.workers.dev/tickets/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ID: ticketNumber,          // Assuming ticketNumber is the ID
                    Ticket_Type: "Guest",   // e.g., "Guest" or "Student"
                    Inviter: data.inviterID,          // The StudentID or GuestID
                    Owner: data.name,              // The name or ID of the owner
                    GradeLevel: null           // Pass null if no grade level is needed
                }),
            });
        
            if (!response.ok) {
                if (response.status === 403) {
                    alert('A ticket with this ID already exists. Please use a different ID.');
                    return;
                } 
                const errorData = await response.json();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error}`);
            }
            const responsedata = await response.json();
            alert(`Ticket ${ticketNumber} added successfully!`);
            const firstnamei = document.getElementById('firstName');
            const lastnamei = document.getElementById('lastName');
            const inviterIDi = document.getElementById('inviterID');
            const ticketNumberi = document.getElementById('ticketNumber');
            firstnamei.value = '';
            lastnamei.value = '';
            inviterIDi.value = '';
            ticketNumberi.value = '';
        } catch (error) {
            console.error('Error:', error);
        }
    }

    dropdownItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor behavior
            tickettypealert.style.display = 'none'; // Hide the alert message
            const selectedValue = this.getAttribute('data-value'); // Get the value of the selected item
            if (selectedValue === 'Student') {
                const studentName = document.getElementById('studentName');
                const homeroomTeacher = document.getElementById('homeroomTeacher');
                const gradeLevel = document.getElementById('gradeLevel');
                if (studentName) {
                    studentName.remove();
                    homeroomTeacher.remove();
                    gradeLevel.remove();
                }
                studentSubmission.style.display = 'block';
                guestSubmission.style.display = 'none';
                verifyStudentButton.style.display = 'block';
                studentNumberInput.style.display = 'block';
                studentheader.style.display = 'block';
                ticketbox.style.display = 'none';

            } else if (selectedValue === 'Guest') {
                const studentName = document.getElementById('studentName');
                const homeroomTeacher = document.getElementById('homeroomTeacher');
                const gradeLevel = document.getElementById('gradeLevel');
                if (studentName) {
                    studentName.remove();
                    homeroomTeacher.remove();
                    gradeLevel.remove();
                }
                studentSubmission.style.display = 'none';
                ticketbox.style.display = 'none';
                guestSubmission.style.display = 'block';
            }
        });
    });

    verifyStudentButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (!studentNumberInput.value) {
            alert('Please enter a student number.');
            return;
        }
        handleStudentForm();
    });
    const guestticketSubmit = document.getElementById('guestticketSubmit');
    guestticketSubmit.addEventListener('click', function(event) {
        event.preventDefault();
        handleGuestForm();
    });
});
