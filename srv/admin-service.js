const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {


    const bp = await cds.connect.to('API_BUSINESS_PARTNER');

    const {
        Vendors,
        Invoices,
        InvoiceItems,
        ApprovalHistory
    } = this.entities;

    // ============================================================
    // Initialize fieldControl for brand-new invoice drafts
    // ============================================================
    this.before('NEW', Invoices, (req) => {
        req.data.fieldControl = 7; // Editable/Mandatory for new DRAFT invoices
    });

    // ============================================================
    // Validate Invoice before Create
    // ============================================================
    this.before('CREATE', Invoices, async (req) => {

        const data = req.data;

        // Vendor Validation
        if (!data.vendor_ID) {
            return req.error(400, 'Please select a vendor');
        }

        const vendor = await SELECT.one
            .from(Vendors)
            .where({ ID: data.vendor_ID });

        if (!vendor) {
            return req.error(404, 'Vendor not found');
        }

        if (vendor.status !== 'APPROVED') {
            return req.error(400, 'Please select an approved vendor');
        }

        // Amount Validation
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

        // Invoice Date Validation
        if (
            data.invoiceDate &&
            new Date(data.invoiceDate) > new Date()
        ) {
            return req.error(
                400,
                'Invoice date cannot be in the future'
            );
        }

        // Due Date Validation
        if (
            data.invoiceDate &&
            data.dueDate &&
            new Date(data.dueDate) < new Date(data.invoiceDate)
        ) {
            return req.error(
                400,
                'Due date must be on or after invoice date'
            );
        }

        // Duplicate Invoice Number
        const duplicate = await SELECT.one
            .from(Invoices)
            .where({
                vendor_ID: data.vendor_ID,
                invoiceNumber: data.invoiceNumber
            });

        if (duplicate) {
            return req.error(
                400,
                'Invoice number already exists for this vendor'
            );
        }

        data.status = 'DRAFT';
    });

    // ============================================================
    // Block Edit (draft creation) for non-DRAFT invoices
    // ============================================================
    this.before('EDIT', Invoices, async (req) => {

        const invoiceID = req.params[0].ID ?? req.params[0];

        const invoice = await SELECT.one
            .from(Invoices)
            .where({ ID: invoiceID });

        if (invoice && invoice.status !== 'DRAFT') {
            return req.reject(
                403,
                `Cannot edit an invoice in ${invoice.status} status. Only DRAFT invoices can be edited.`
            );
        }
    });

    // ============================================================
    // Calculate Line Total — covers NEW, CREATE, UPDATE, PATCH
    // so it fires no matter which event the draft framework uses
    // ============================================================
    this.before(['NEW', 'CREATE', 'UPDATE', 'PATCH'], InvoiceItems, async (req) => {

        const data = req.data;

        let quantity = data.quantity;
        let unitPrice = data.unitPrice;

        // For PATCH/UPDATE, the key lives in req.params, not req.data
        const key = req.params?.[0]?.ID ?? req.params?.[0] ?? data.ID;

        if ((quantity === undefined || unitPrice === undefined) && key) {
            const existing = await SELECT.one.from(InvoiceItems).where({ ID: key });
            if (existing) {
                quantity  = quantity  !== undefined ? quantity  : existing.quantity;
                unitPrice = unitPrice !== undefined ? unitPrice : existing.unitPrice;
            }
        }

        if (quantity !== undefined && Number(quantity) <= 0) {
            return req.error(400, 'Quantity must be greater than zero');
        }

        if (unitPrice !== undefined && Number(unitPrice) <= 0) {
            return req.error(400, 'Unit Price must be greater than zero');
        }

        if (quantity !== undefined && unitPrice !== undefined) {
            data.totalAmount = Number(quantity) * Number(unitPrice);
        }

    });

    // ============================================================
    // Safety net: if totalAmount is ever null/missing on READ,
    // recompute it on the fly so the UI never shows a blank value
    // ============================================================
    this.after('READ', InvoiceItems, (data) => {

        const rows = Array.isArray(data) ? data : [data];

        for (const row of rows) {
            if (!row) continue;

            if (
                (row.totalAmount === null || row.totalAmount === undefined) &&
                row.quantity != null &&
                row.unitPrice != null
            ) {
                row.totalAmount = Number(row.quantity) * Number(row.unitPrice);
            }
        }
    });

    // ============================================================
    // Compute Criticality, Action Visibility & Field Control (Invoices)
    // ============================================================
    this.after('READ', Invoices, (data) => {

        const rows = Array.isArray(data) ? data : [data];

        for (const row of rows) {
            if (!row) continue;

            // Status criticality: 0=Neutral(Grey) 1=Negative(Red) 2=Critical(Orange) 3=Positive(Green)
            switch (row.status) {
                case 'DRAFT':
                    row.statusCriticality = 0;
                    break;
                case 'SUBMITTED':
                    row.statusCriticality = 2;
                    break;
                case 'APPROVED':
                    row.statusCriticality = 3;
                    break;
                case 'REJECTED':
                    row.statusCriticality = 1;
                    break;
                case 'PAID':
                    row.statusCriticality = 3;
                    break;
                default:
                    row.statusCriticality = 0;
            }

            // Semantic coloring for high-value amounts (threshold: 50,000)
            const numericAmount = Number(row.amount);
            row.amountCriticality = numericAmount > 50000 ? 2 : 0;

            // Conditional action visibility based on status
            row.canSubmit  = row.status === 'DRAFT';
            row.canApprove = row.status === 'SUBMITTED';
            row.canReject  = row.status === 'SUBMITTED';

            // Field control: 7 = Editable, 1 = ReadOnly (Core.FieldControlType enum)
            row.fieldControl = row.status === 'DRAFT' ? 7 : 1;

            // Backfill totalAmount on any nested/expanded line items
            if (Array.isArray(row.items)) {
                for (const item of row.items) {
                    if (
                        (item.totalAmount === null || item.totalAmount === undefined) &&
                        item.quantity != null &&
                        item.unitPrice != null
                    ) {
                        item.totalAmount = Number(item.quantity) * Number(item.unitPrice);
                    }
                }
            }
        }
    });

    // ============================================================
    // Compute Criticality (Vendors)
    // ============================================================
    this.after('READ', Vendors, (data) => {

        const rows = Array.isArray(data) ? data : [data];

        for (const row of rows) {
            if (!row) continue;

            switch (row.status) {
                case 'APPROVED':
                    row.vendorStatusCriticality = 3;
                    break;
                case 'PENDING':
                    row.vendorStatusCriticality = 2;
                    break;
                case 'SUSPENDED':
                    row.vendorStatusCriticality = 1;
                    break;
                case 'DELETED':
                    row.vendorStatusCriticality = 0;
                    break;
                default:
                    row.vendorStatusCriticality = 0;
            }
        }
    });

    // ============================================================
    // Submit Invoice for Approval
    // (Test Scenarios 2 & 3: validation failure + success)
    // ============================================================
    this.on('submitForApproval', Invoices, async (req) => {

        const invoiceID = req.params?.[0]?.ID;

        if (!invoiceID) {
            return req.error(400, 'Invoice ID is missing');
        }

        const tx = cds.tx(req);

        const invoice = await tx.run(
            SELECT.one
                .from(Invoices)
                .where({ ID: invoiceID })
        );

        if (!invoice) {
            return req.error(404, 'Invoice not found');
        }

        if (invoice.status !== 'DRAFT') {
            return req.error(
                400,
                'Only draft invoices can be submitted'
            );
        }

        const items = await tx.run(
            SELECT.from(InvoiceItems)
                .where({ invoice_ID: invoiceID })
        );

        if (!items.length) {
            return req.error(
                400,
                'Invoice must contain at least one line item'
            );
        }

        const total = items.reduce(
            (sum, item) =>
                sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)),
            0
        );

        const invoiceAmount = Number(invoice.amount).toFixed(2);
        const calculatedTotal = total.toFixed(2);

        if (invoiceAmount !== calculatedTotal) {
            return req.error(
                400,
                `Invoice amount (${invoiceAmount}) does not match line item total (${calculatedTotal})`
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
            SELECT.one
                .from(Invoices)
                .where({ ID: invoiceID })
        );

    });

    // ============================================================
    // Approve Invoice
    // (Test Scenarios 4 & 5: self-approval blocked + success)
    // ============================================================
    this.on('approveInvoice', Invoices, async (req) => {

        const invoiceID = req.params?.[0]?.ID;

        if (!invoiceID) {
            return req.error(400, 'Invoice ID is missing');
        }

        const tx = cds.tx(req);

        const invoice = await tx.run(
            SELECT.one
                .from(Invoices)
                .where({ ID: invoiceID })
        );

        if (!invoice) {
            return req.error(404, 'Invoice not found');
        }

        if (invoice.status !== 'SUBMITTED') {
            return req.error(
                400,
                'Only submitted invoices can be approved'
            );
        }

        if (invoice.submittedBy === req.user.id) {
            return req.error(
                403,
                'You cannot approve your own submitted invoice'
            );
        }

        await tx.run(
            UPDATE(Invoices)
                .set({
                    status: 'APPROVED',
                    approvedBy: req.user.id,
                    approvedAt: new Date().toISOString(),
                    approvalComments: req.data.comments || ''
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
                comments: req.data.comments || 'Invoice approved'
            })
        );

        return await tx.run(
            SELECT.one
                .from(Invoices)
                .where({ ID: invoiceID })
        );

    });

    // ============================================================
    // Reject Invoice
    // (Test Scenario 6: mandatory reason + rejection)
    // ============================================================
    this.on('rejectInvoice', Invoices, async (req) => {

        const invoiceID = req.params?.[0]?.ID;

        if (!invoiceID) {
            return req.error(400, 'Invoice ID is missing');
        }

        const { reason } = req.data;

        if (!reason || !reason.trim()) {
            return req.error(400, 'Rejection reason is mandatory');
        }

        const tx = cds.tx(req);

        const invoice = await tx.run(
            SELECT.one
                .from(Invoices)
                .where({ ID: invoiceID })
        );

        if (!invoice) {
            return req.error(404, 'Invoice not found');
        }

        if (invoice.status !== 'SUBMITTED') {
            return req.error(
                400,
                'Only submitted invoices can be rejected'
            );
        }

        await tx.run(
            UPDATE(Invoices)
                .set({
                    status: 'REJECTED',
                    rejectedBy: req.user.id,
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: reason
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
                comments: reason
            })
        );

        return await tx.run(
            SELECT.one
                .from(Invoices)
                .where({ ID: invoiceID })
        );

    });

    // ============================================================
    // Sync Vendors from S/4HANA
    // (Test Scenario 7: sync + status defaults to PENDING)
    // ============================================================
    this.on("syncVendors", async (req) => {

        const tx = cds.tx(req);

        let created = 0;
        let updated = 0;
        let skipped = 0;
        let errors = 0;
        const errorDetails = [];

        try {

            // Step 1: Get the list of BP numbers that are actual Suppliers
            const supplierRecords = await bp.run(
                SELECT.from("A_Supplier").columns("Supplier")
            );

            const supplierIds = new Set(
                (supplierRecords || []).map(s => s.Supplier)
            );

            console.log(`S/4HANA returned ${supplierIds.size} Supplier IDs`);

            if (supplierIds.size === 0) {
                return {
                    total: 0,
                    created: 0,
                    updated: 0,
                    message: "No suppliers found in S/4HANA."
                };
            }

            // Step 2: Get full Business Partner details
            const allBusinessPartners = await bp.run(

                SELECT.from("A_BusinessPartner").columns(

                    "BusinessPartner",
                    "BusinessPartnerCategory",
                    "BusinessPartnerName",
                    "BusinessPartnerFullName",
                    "OrganizationBPName1",
                    "FirstName",
                    "LastName",

                    {
                        ref: ["to_BusinessPartnerAddress"],
                        expand: [
                            "StreetName",
                            "HouseNumber",
                            "CityName",
                            "PostalCode",
                            "Country",
                            {
                                ref: ["to_EmailAddress"],
                                expand: ["EmailAddress"]
                            },
                            {
                                ref: ["to_PhoneNumber"],
                                expand: ["PhoneNumber"]
                            }
                        ]
                    },

                    {
                        ref: ["to_BusinessPartnerTax"],
                        expand: ["BPTaxNumber"]
                    }

                )

            );

            console.log(`S/4HANA returned ${allBusinessPartners?.length ?? 0} Business Partner records`);

            // Step 3: Filter to only actual Suppliers (JS Set match)
            const suppliers = allBusinessPartners.filter(
                bpRec => supplierIds.has(bpRec.BusinessPartner)
            );

            console.log(`Matched ${suppliers.length} Business Partners that are Suppliers`);

            if (suppliers.length === 0) {
                return {
                    total: 0,
                    created: 0,
                    updated: 0,
                    message: "No matching supplier records found."
                };
            }

            for (const supplier of suppliers) {

                const bpNumber = supplier.BusinessPartner;

                if (!bpNumber) {
                    skipped++;
                    continue;
                }

                try {

                    const address =
                        supplier.to_BusinessPartnerAddress?.[0] || {};

                    const email =
                        address.to_EmailAddress?.[0]?.EmailAddress || "";

                    const phone =
                        address.to_PhoneNumber?.[0]?.PhoneNumber || "";

                    const tax =
                        supplier.to_BusinessPartnerTax?.[0]?.BPTaxNumber || "";

                    const fullAddress = [
                        address.StreetName,
                        address.HouseNumber,
                        address.CityName,
                        address.PostalCode
                    ]
                        .filter(Boolean)
                        .join(", ");

                    const personName = [supplier.FirstName, supplier.LastName]
                        .filter(Boolean)
                        .join(' ');

                    const vendorName =
                        supplier.OrganizationBPName1 ||
                        supplier.BusinessPartnerFullName ||
                        supplier.BusinessPartnerName ||
                        personName ||
                        `Vendor ${bpNumber}`;

                    const existingVendor = await tx.run(
                        SELECT.one
                            .from(Vendors)
                            .where({ externalSystemId: bpNumber })
                    );

                    if (existingVendor) {

                        // UPDATE: master data only — status is NEVER overwritten,
                        // since it's owned by the local approval workflow
                        await tx.run(
                            UPDATE(Vendors)
                                .set({
                                    vendorName: vendorName,
                                    email: email,
                                    phone: phone,
                                    address: fullAddress,
                                    country: address.Country || "",
                                    currency_code: "USD",
                                    taxId: tax,
                                    assignedManager: "manager1@company.com"
                                    // status intentionally omitted
                                })
                                .where({ ID: existingVendor.ID })
                        );

                        updated++;

                    } else {

                        // INSERT: status defaults to PENDING only for new vendors
                        await tx.run(
                            INSERT.into(Vendors).entries({
                                vendorName: vendorName,
                                email: email,
                                phone: phone,
                                address: fullAddress,
                                country: address.Country || "",
                                currency_code: "USD",
                                taxId: tax,
                                externalSystemId: bpNumber,
                                assignedManager: "manager1@company.com",
                                status: "PENDING"
                            })
                        );

                        created++;

                    }

                } catch (recordErr) {
                    errors++;
                    errorDetails.push({ bpNumber, error: recordErr.message });
                    console.error(`Failed to sync BP ${bpNumber}:`, recordErr.message);
                }

            }

            console.log(
                `Sync complete: created=${created}, updated=${updated}, skipped=${skipped}, errors=${errors}`
            );

            if (errorDetails.length) {
                console.log('First few errors:', JSON.stringify(errorDetails.slice(0, 5), null, 2));
            }

            return {
                total: created + updated,
                created,
                updated,
                message: errors > 0
                    ? `Sync completed with ${errors} error(s). ${created} created, ${updated} updated, ${skipped} skipped.`
                    : "Vendor synchronization completed successfully."
            };

        } catch (err) {
            console.error('Sync failed entirely:', err);
            req.error(500, "S/4HANA Vendor Synchronization Failed: " + err.message);
        }

    });

});