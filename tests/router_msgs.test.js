const {createUrl, postData, getData} = require('../src/router_msgs.js');

test('Crea una url', () => {
    const url = createUrl('time');
    expect(url).toBe(`https://hamponator-web-default-rtdb.europe-west1.firebasedatabase.app/time.json`);
});

test('Connect to Firebase', async () => {
    getData('time').then(response => {
        expect(response.json()).toBe('{name:"hampo"}');
    });
});