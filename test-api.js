const https = require('https');

// Ignorer les erreurs de certificat SSL pour le dev
const agent = new https.Agent({ rejectUnauthorized: false });

async function testAPI() {
    console.log('🧪 Test des API Reservants et Contacts\n');

    // Test 1: Lister les reservants
    console.log('📋 Test 1: GET /api/reservant');
    try {
        const reservants = await makeRequest('/api/reservant');
        console.log(`✅ ${reservants.length} reservant(s) trouvé(s)`);
        if (reservants.length > 0) {
            console.log(`   Premier reservant: ${reservants[0].name} (ID: ${reservants[0].id})`);
        }
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
    }

    // Test 2: Lister les contacts d'un reservant
    console.log('\n📋 Test 2: GET /api/reservant/1/contacts');
    try {
        const contacts = await makeRequest('/api/reservant/1/contacts');
        console.log(`✅ ${contacts.length} contact(s) trouvé(s)`);
        contacts.forEach(c => console.log(`   - ${c.name} (${c.email})`));
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
    }

    // Test 3: Timeline des contacts
    console.log('\n📋 Test 3: GET /api/reservant/1/contacts/timeline');
    try {
        const timeline = await makeRequest('/api/reservant/1/contacts/timeline');
        console.log(`✅ ${timeline.length} événement(s) de contact dans la timeline`);
        timeline.slice(0, 3).forEach(t => {
            console.log(`   - ${t.contact_name} le ${new Date(t.date_contact).toLocaleDateString()}`);
        });
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
    }

    // Test 4: Créer un nouveau contact
    console.log('\n📋 Test 4: POST /api/reservant/1/contacts');
    try {
        const newContact = {
            name: 'Test Contact ' + Date.now(),
            email: 'test' + Date.now() + '@example.com',
            phone_number: '0123456789',
            job_title: 'Responsable Test',
            priority: 1
        };
        const created = await makeRequest('/api/reservant/1/contacts', 'POST', newContact);
        console.log(`✅ Contact créé avec succès: ${created.name} (ID: ${created.id})`);
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
    }

    console.log('\n✅ Tests terminés');
}

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: path,
            method: method,
            agent: agent,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
                    }
                } catch (e) {
                    reject(new Error(`Erreur de parsing: ${body}`));
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

testAPI();
