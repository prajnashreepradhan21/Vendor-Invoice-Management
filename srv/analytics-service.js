const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    // ============================================================
    // Role Based Filter
    // ============================================================
    function scopeToUser(user) {

        if (user.is('VendorManager')) {
            return {
                'vendor.assignedManager': user.id
            };
        }

        if (user.is('Viewer')) {
            return {
                status: ['APPROVED', 'PAID']
            };
        }

        // Admin & Approver can view everything
        return {};
    }

    // ============================================================
    // KPI Cards
    // ============================================================
    this.on('getKPIs', async (req) => {

        const tx = cds.tx(req);

        const scope = scopeToUser(req.user);

        const invoices = await tx.run(
            SELECT.from('com.vendor.invoice.management.Invoices')
                .columns(
                    'amount',
                    'status'
                )
                .where(scope)
        );

        const totalInvoices = invoices.length;

        const totalAmount = invoices.reduce(
            (sum, invoice) => sum + Number(invoice.amount || 0),
            0
        );

        const pendingApprovals = invoices.filter(
            invoice => invoice.status === 'SUBMITTED'
        ).length;

        const rejectedInvoices = invoices.filter(
            invoice => invoice.status === 'REJECTED'
        ).length;

        return {
            totalInvoices,
            totalAmount,
            pendingApprovals,
            rejectedInvoices
        };

    });
        // ============================================================
    // Status Breakdown
    // ============================================================
    this.on('getStatusBreakdown', async (req) => {

        const tx = cds.tx(req);

        const scope = scopeToUser(req.user);

        const invoices = await tx.run(
            SELECT.from('com.vendor.invoice.management.Invoices')
                .columns('status')
                .where(scope)
        );

        const statusCount = {};

        for (const invoice of invoices) {

            if (!statusCount[invoice.status]) {
                statusCount[invoice.status] = 0;
            }

            statusCount[invoice.status]++;

        }

        return Object.entries(statusCount).map(
            ([status, count]) => ({
                status,
                count
            })
        );

    });

    // ============================================================
    // Invoice Trend (Last 12 Months)
    // ============================================================
    this.on('getInvoiceTrend', async (req) => {

        const tx = cds.tx(req);

        const scope = scopeToUser(req.user);

        const invoices = await tx.run(
            SELECT.from('com.vendor.invoice.management.Invoices')
                .columns('invoiceDate')
                .where(scope)
        );

        const currentDate = new Date();

        const months = [];

        for (let i = 11; i >= 0; i--) {

            const month = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - i,
                1
            );

            months.push(month.toISOString().slice(0, 7));

        }

        const trend = {};

        months.forEach(month => {
            trend[month] = 0;
        });

        for (const invoice of invoices) {

            const month = String(invoice.invoiceDate).slice(0, 7);

            if (trend[month] !== undefined) {
                trend[month]++;
            }

        }

        return months.map(month => ({
            month,
            count: trend[month]
        }));

    });
        // ============================================================
    // Top 5 Vendors by Invoice Amount
    // ============================================================
    this.on('getTopVendors', async (req) => {

        const tx = cds.tx(req);

        const scope = scopeToUser(req.user);

        const invoices = await tx.run(
            SELECT.from('com.vendor.invoice.management.Invoices')
                .columns(
    'vendor_ID',
    'amount',
    { ref: ['vendor', 'vendorName'], as: 'vendorName' }
)
                .where(scope)
        );

        const vendorTotals = {};

        for (const invoice of invoices) {

            if (!vendorTotals[invoice.vendor_ID]) {

                vendorTotals[invoice.vendor_ID] = {
                    vendorID: invoice.vendor_ID,
                    vendorName: invoice.vendorName,
                    totalAmount: 0
                };

            }

            vendorTotals[invoice.vendor_ID].totalAmount +=
                Number(invoice.amount || 0);

        }

        return Object.values(vendorTotals)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 5);

    });

});