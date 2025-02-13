function parsePDF() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) {
        alert("Please upload a PDF file!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const pdfData = new Uint8Array(event.target.result);

        // Use PDF.js to parse the PDF
        pdfjsLib.getDocument(pdfData).promise.then(function(pdf) {
            let textContent = '';
            let totalPages = pdf.numPages;
            let pagePromises = [];

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                pagePromises.push(pdf.getPage(pageNum).then(function(page) {
                    return page.getTextContent().then(function(text) {
                        textContent += text.items.map(item => item.str).join(' ') + ' ';
                    });
                }));
            }

            Promise.all(pagePromises).then(function() {
                analyzeCareer(textContent);
            });
        }).catch(function(error) {
            console.error("Error reading PDF: ", error);
            document.getElementById("error-message").textContent = "There was an error reading the PDF. Please try again.";
        });
    };

    reader.readAsArrayBuffer(file);
}

function analyzeCareer(textContent) {
    const careerInfo = extractCareerDetails(textContent);
    if (careerInfo) {
        displayCareerInfo(careerInfo);
    } else {
        document.getElementById("error-message").textContent = "Couldn't extract career details. Make sure the PDF is properly formatted.";
    }
}

function extractCareerDetails(text) {
    // This will need to be more sophisticated, but here's a simple approach
    const experienceRegex = /(?<=Experience)([\s\S]*?)(?=Education|Skills|Certifications)/g;
    const matches = text.match(experienceRegex);

    if (!matches) return null;

    let roles = [];
    matches.forEach(match => {
        const jobRegex = /(\d{4}-\d{4}|Present)([^,]+), (.*?)(?=\d{4}-|Present)/g;
        const roleDetails = [...match.matchAll(jobRegex)];
        
        roleDetails.forEach(role => {
            const startEndDate = role[1].split('-');
            const startDate = new Date(startEndDate[0].trim());
            const endDate = startEndDate[1]?.trim() === "Present" ? new Date() : new Date(startEndDate[1].trim());
            const timeSpent = calculateTimeSpent(startDate, endDate);
            const roleDetails = {
                company: role[2].trim(),
                title: role[3].trim(),
                startDate: startEndDate[0].trim(),
                endDate: startEndDate[1]?.trim() || "Present",
                timeSpent: timeSpent
            };
            roles.push(roleDetails);
        });
    });

    return roles;
}

function calculateTimeSpent(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    return `${diffYears} years, ${diffMonths} months`;
}

function displayCareerInfo(roles) {
    const careerInfoDiv = document.getElementById("careerInfo");
    careerInfoDiv.innerHTML = '';

    roles.forEach(role => {
        const roleElement = document.createElement("div");
        roleElement.classList.add("role");

        const roleInfo = `
            <p><strong>Title/Role:</strong> ${role.title}</p>
            <p><strong>Experience Range:</strong> ${role.startDate} - ${role.endDate}</p>
            <p><strong>Company:</strong> ${role.company}</p>
            <p><strong>Time Spent:</strong> ${role.timeSpent}</p>
        `;
        roleElement.innerHTML = roleInfo;
        careerInfoDiv.appendChild(roleElement);
    });

    // Display total career trajectory
    const totalCareerElement = document.createElement("div");
    totalCareerElement.classList.add("total-career");

    const totalCareerInfo = roles.map(role => `
        <p><strong>Title/Role:</strong> ${role.title}</p>
        <p><strong>Experience Range:</strong> ${role.startDate} - ${role.endDate}</p>
        <p><strong>Company:</strong> ${role.company}</p>
    `).join('');

    totalCareerElement.innerHTML = `<h3>Total Career Trajectory:</h3>${totalCareerInfo}`;
    careerInfoDiv.appendChild(totalCareerElement);
}
