using com.vendor.invoice.management as db from '../db/schema';

@requires: ['Admin', 'VendorManager', 'Approver', 'Viewer']
service AnalyticsService {

    @readonly
    entity Analytics as select from db.Invoices {
        key vendor.ID         as vendorID,
            vendor.vendorName as vendorName,
            status,
            currency,
            count(*)          as invoiceCount : Integer,
            sum(amount)       as totalAmount  : Decimal(15,2)
    }
    group by vendor.ID, vendor.vendorName, status, currency;

    function getKPIs() returns {
        totalInvoices    : Integer;
        totalAmount      : Decimal(15,2);
        pendingApprovals : Integer;
        rejectedInvoices : Integer;
    };

    function getStatusBreakdown() returns array of {
        status : String;
        count  : Integer;
    };

    function getInvoiceTrend() returns array of {
        month : String;
        count : Integer;
    };

    function getTopVendors() returns array of {
        vendorID    : UUID;
        vendorName  : String;
        totalAmount : Decimal(15,2);
    };
}