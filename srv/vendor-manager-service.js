const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const {
        Vendors,
        Invoices,
        InvoiceItems,
        ApprovalHistory
    } = this.entities;

    // ============================================================
    // Validate Invoice before Create
    // ============================================================
    this.before('CREATE', Invoices, async (req) => {

        const data = req.data;

        // Vendor validation
        if (!data.vendor_ID) {
            return req.error(400, 'Please select a vendor');
        }

        const vendor = await SELECT.one.from(Vendors).where({ ID: data.vendor_ID });

        if (!vendor) {
            return req.error(404, 'Vendor not found');
        }

        if (vendor.status !== 'APPROVED') {
            return req.error(400, 'Please select an approved vendor');
        }

        if (vendor.assignedManager !== req.user.id) {
            return req.error(403, 'You can only create invoices for your assigned vendors');
        }

        // Amount validation
       if (
    data.amount === undefined ||
    data.amount <= 0 ||
    data.amount > 1000000
) {
    return req.error(
        400,
        'Invoice amount must be between 0.01 and 1,000,000'
    );
}

        // Invoice Date
        if (data.invoiceDate && new Date(data.invoiceDate) > new Date()) {
            return req.error(400, 'Invoice date cannot be in the future');
        }

        // Due Date
        if (
            data.invoiceDate &&
            data.dueDate &&
            new Date(data.dueDate) < new Date(data.invoiceDate)
        ) {
            return req.error(400, 'Due date must be on or after invoice date');
        }

        // Duplicate Invoice Number
        const existing = await SELECT.one
            .from(Invoices)
            .where({
                invoiceNumber: data.invoiceNumber,
                vendor_ID: data.vendor_ID
            });

        if (existing) {
            return req.error(
                400,
                `Invoice number ${data.invoiceNumber} already exists for this vendor`
            );
        }

        data.status = 'DRAFT';

    });

    // ============================================================
    // Calculate Line Total
    // ============================================================
    this.before(['CREATE', 'UPDATE'], InvoiceItems, async (req) => {

        const { quantity, unitPrice } = req.data;

        if (quantity !== undefined && quantity <= 0) {
            return req.error(400, 'Quantity must be greater than zero');
        }

        if (unitPrice !== undefined && unitPrice <= 0) {
            return req.error(400, 'Unit Price must be greater than zero');
        }

        if (quantity !== undefined && unitPrice !== undefined) {
            req.data.totalAmount =  Number(quantity) * Number(unitPrice);
        }

    });

    // ============================================================
    // Submit Invoice
    // ============================================================
    this.on('submitForApproval', Invoices, async (req) => {

        
        const invoiceID = req.params?.[0]?.ID;

if (!invoiceID) {
    return req.error(400, 'Invoice ID is missing');
}

        const tx = cds.tx(req);

        const invoice = await tx.run(
            SELECT.one.from(Invoices).where({ ID: invoiceID })
        );

        if (!invoice) {
            return req.error(404, 'Invoice not found');
        }

        if (invoice.status !== 'DRAFT') {
            return req.error(400, 'Only Draft invoices can be submitted');
        }

        const items = await tx.run(
            SELECT.from(InvoiceItems).where({ invoice_ID: invoiceID })
        );

        if (!items.length) {
            return req.error(400, 'Invoice must contain at least one line item');
        }

        const total = items.reduce(
            (sum, item) => sum + Number(item.totalAmount || 0),
            0
        );

        if (Math.abs(total - Number(invoice.amount)) > 0.01) {
            return req.error(
                400,
                'Invoice amount does not match line item total'
            );
        }

        await tx.run(
            UPDATE(Invoices)
                .set({
                    status: 'SUBMITTED',
                    submittedBy: req.user.id,
                    submittedAt: new Date().toISOString()
                })
                .where({ ID: invoiceID })
        );

        await tx.run(
            INSERT.into(ApprovalHistory).entries({
                invoice_ID: invoiceID,
                action: 'SUBMITTED',
                actorName: req.user.id,
                actorId: req.user.id,
                actionAt: new Date().toISOString(),
                comments: 'Invoice submitted for approval'
            })
        );

        return await tx.run(
            SELECT.one.from(Invoices).where({ ID: invoiceID })
        );

    });

});