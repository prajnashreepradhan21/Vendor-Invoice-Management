using com.vendor.invoice.management as db from '../db/schema';

@requires: 'Approver'
service ApproverService {

    entity Invoices as projection on db.Invoices {
        *,
        virtual null as statusCriticality : Integer
    }
        where status = 'SUBMITTED'
        actions {
            action approveInvoice(comments : String(500)) returns Invoices;
            action rejectInvoice(reason : String(500) not null) returns Invoices;
        };

    @readonly
    entity Vendors as projection on db.Vendors;

    @readonly
    entity InvoiceItems as projection on db.InvoiceItems;

    @readonly
    entity Attachments as projection on db.Attachments;

    @readonly
    entity ApprovalHistory as projection on db.ApprovalHistory;
}