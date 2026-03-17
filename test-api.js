const fetch = require('node-fetch');

(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
                language: 'english'
            })
        });
        const text = await res.text();
        console.log(`STATUS: ${res.status}`);
        console.log(`BODY: ${text}`);
    } catch(e) {
        console.error(e);
    }
})();
