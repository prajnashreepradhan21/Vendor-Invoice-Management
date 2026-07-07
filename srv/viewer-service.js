const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    this.before(['CREATE', 'UPDATE', 'DELETE'], '*', (req) => {
        req.reject(403, 'Viewer role has read-only access.');
    });

});