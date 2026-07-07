const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { Invoices, ApprovalHistory } = this.entities;

    // ============================================================
    // Compute Status Criticality on READ
    // (needed for the annotations.cds Criticality binding in approver-ui)
    // ============================================================
    this.after('READ', Invoices, (data) => {
        const rows = Array.isArray(data) ? data : [data];
        for (const row of rows) {
            if (!row) continue;
            row.statusCriticality = row.status === 'SUBMITTED' ? 2 : 0;
        }
    });

    // ============================================================
    // Approve Invoice
    // ============================================================
    this.on('approveInvoice', 'Invoices', async (req) => {

        const invoiceID = req.params?.[0]?.ID;

        if (!invoiceID) {
            return req.error(400, 'Invoice ID is missing');
        }

        const tx = cds.transaction(req);

        const invoice = await tx.run(
            SELECT.one.from(Invoices).where({ ID: invoiceID })
        );

        if (!invoice) {
            return req.error(404, 'Invoice not found');
        }

        if (invoice.status !== 'SUBMITTED') {
            return req.error(400, 'Only submitted invoices can be approved');
        }

        if (invoice.submittedBy === req.user.id) {
            return req.error(400, 'You cannot approve your own invoice');
        }

        await tx.run(
            UPDATE(Invoices)
                .set({
                    status: 'APPROVED',
                    approvedBy: req.user.id,
                    approvedAt: new Date().toISOString(),
                    approvalComments: req.data.comments
                })
                .where({ ID: invoiceID })
        );

        await tx.run(
            INSERT.into(ApprovalHistory).entries({
                invoice_ID: invoiceID,
                action: 'APPROVED',
                actorName: req.user.id,
                actorId: req.user.id,
                actionAt: new Date().toISOString(),
                comments: req.data.comments
            })
        );

        return await tx.run(
            SELECT.one.from(Invoices).where({ ID: invoiceID })
        );

    });

    // ============================================================
    // Reject Invoice
    // ============================================================
    this.on('rejectInvoice', 'Invoices', async (req) => {

        const invoiceID = req.params?.[0]?.ID;

        if (!invoiceID) {
            return req.error(400, 'Invoice ID is missing');
        }

        if (!req.data.reason) {
            return req.error(400, 'Rejection reason is mandatory');
        }

        const tx = cds.transaction(req);

        const invoice = await tx.run(
            SELECT.one.from(Invoices).where({ ID: invoiceID })
        );

        if (!invoice) {
            return req.error(404, 'Invoice not found');
        }

        if (invoice.status !== 'SUBMITTED') {
            return req.error(400, 'Only submitted invoices can be rejected');
        }

        await tx.run(
            UPDATE(Invoices)
                .set({
                    status: 'REJECTED',
                    rejectedBy: req.user.id,
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: req.data.reason
                })
                .where({ ID: invoiceID })
        );

        await tx.run(
            INSERT.into(ApprovalHistory).entries({
                invoice_ID: invoiceID,
                action: 'REJECTED',
                actorName: req.user.id,
                actorId: req.user.id,
                actionAt: new Date().toISOString(),
                comments: req.data.reason
            })
        );

        return await tx.run(
            SELECT.one.from(Invoices).where({ ID: invoiceID })
        );

    });

});