document.getElementById('uploadButton').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file && file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                pdf.getPage(1).then(function(page) {
                    page.getTextContent().then(function(textContent) {
                        const text = textContent.items.map(item => item.str).join(' ');
                        analyzeProfile(text);
                    });
                });
            });
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Please upload a valid PDF file.');
    }
});

function analyzeProfile(text) {
    const output = document.getElementById('output');
    const nameMatch = text.match(/Contact\s+www\.linkedin\.com\/in\/([^\s]+)/);
    const experienceMatch = text.match(/Experience\s+([^\n]+)/);
    const roles = text.match(/(\d+ years \d+ months|Present)/g);

    if (nameMatch && experienceMatch && roles) {
        const name = nameMatch[1];
        const experience = experienceMatch[1];
        const roleDurations = roles.map(role => role.replace('Present', '0 years 0 months'));

        output.innerHTML = `
            <h2>Profile Analysis</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Experience:</strong> ${experience}</p>
            <p><strong>Roles:</strong> ${roleDurations.join(', ')}</p>
        `;
    } else {
        output.innerHTML = '<p>Could not extract profile information.</p>';
    }
}
