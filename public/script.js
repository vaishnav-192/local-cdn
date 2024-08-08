const downloadResults = document.getElementById('downloadResults');
import { get } from 'axios';

function renderDownloadResults(results) {
    downloadResults.innerHTML = '';

    if (!Array.isArray(results) || results.length === 0) {
        downloadResults.innerHTML = '<p>No results found.</p>';
        return;
    }

    const list = document.createElement('ul');
    results.forEach((result) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
        <span>Content Type:</span> ${result.contentType} <br>
        <span>File Name:</span> ${result.fileName} <br>
        <span>Server:</span> ${result.server}
      `;
        list.appendChild(listItem);
    });

    downloadResults.appendChild(list);
}



document.addEventListener('DOMContentLoaded', () => {
    const downloadForm = document.getElementById('downloadForm');

    downloadForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const fileName = document.getElementById('filename').value;
        if (!fileName) {
            alert('Please enter a filename to search');
            return;
        }

        // Construct the URL with query parameter
        const baseUrl = window.location.origin; // Get the base URL
        const urlWithPort = `${baseUrl}/fetchResults`; // Construct URL for the fetchResults endpoint

        try {
            // Fetch the results from the master node
            const response = await get(urlWithPort, { params: { fileName } });

            // Check if the request was successful
            if (response.status !== 200) {
                throw new Error(`Error fetching results: ${response.statusText}`);
            }

            const results = response.data; // Get the JSON response
            renderDownloadResults(results); // Call function to render data
        } catch (error) {
            console.error('Error fetching download results:', error);
            alert('Error fetching download results'); // Display error message to user
        }
    });
});