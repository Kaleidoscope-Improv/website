const GOOGLE_SHEET_ID = '2PACX-1vTMlSM8Zk6bXrftMZ-Pj0o-Ddod1ANoWDMol2vLQRapze1aU_T0-eSWN5mfprsWKDL5aYCS1AdSnHxR';

async function fetchShows() {
    try {
        const isPublishedId = GOOGLE_SHEET_ID.startsWith('2PACX');
        const url = isPublishedId
            ? `https://docs.google.com/spreadsheets/d/e/${GOOGLE_SHEET_ID}/pub?output=tsv`
            : `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=tsv`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP-Error: " + response.status);
        const text = await response.text();

        console.log("Raw text:", text.length, "chars");
        
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length < 2) throw new Error("Sheet is empty or missing headers");

        const headers = lines[0].split('\t').map(h => h.toLowerCase().trim().replace('\r', ''));
        console.log("Headers:", headers);
        const titleIdx = headers.indexOf('title');
        const dateIdx = headers.indexOf('date');
        const venueIdx = headers.indexOf('venue');
        const timeIdx = headers.indexOf('time');
        const linkIdx = headers.indexOf('ticketlink');

        let shows = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split('\t').map(c => c.trim().replace('\r', ''));
            if (row.length === 1 && row[0] === '') continue;

            const title = titleIdx !== -1 && row[titleIdx] ? row[titleIdx] : 'Lights Up!';
            const venue = venueIdx !== -1 && row[venueIdx] ? row[venueIdx] : 'TBA';
            const time = timeIdx !== -1 && row[timeIdx] ? row[timeIdx] : '';
            const ticketLink = linkIdx !== -1 && row[linkIdx] ? row[linkIdx] : '#';

            const dateVal = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : null;
            let showDate = null;

            if (dateVal) {
                showDate = new Date(dateVal);
            }

            console.log("Parsed date", dateVal, "to", showDate);

            if (showDate && !isNaN(showDate.getTime()) && showDate >= now) {
                shows.push({ title, date: showDate, venue, time, ticketLink });
            } else {
                console.log("Date rejected:", showDate, "Now:", now);
            }
        }

        console.log("Final shows:", shows);

    } catch(e) {
        console.error(e);
    }
}
fetchShows();
