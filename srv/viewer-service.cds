using com.vendor.invoice.management as db from '../db/schema';

@requires: 'Viewer'
@readonly
service ViewerService {

    entity Invoices as projection on db.Invoices
        where status = 'APPROVED' or status = 'PAID';

    entity Vendors as projection on db.Vendors
        where status = 'APPROVED';

    entity InvoiceItems as projection on db.InvoiceItems
        where invoice.status = 'APPROVED' or invoice.status = 'PAID';

    entity Attachments as projection on db.Attachments
        where invoice.status = 'APPROVED' or invoice.status = 'PAID';

    entity ApprovalHistory as projection on db.ApprovalHistory
        where invoice.status = 'APPROVED' or invoice.status = 'PAID';
}