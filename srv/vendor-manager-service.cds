using com.vendor.invoice.management as db from '../db/schema';

@requires: 'VendorManager'
service VendorManagerService {

    @readonly
    entity Vendors as projection on db.Vendors
        where assignedManager = $user;

    @odata.draft.enabled
    entity Invoices as projection on db.Invoices
        where vendor.assignedManager = $user
        actions {
            action submitForApproval() returns Invoices;
        };

    entity InvoiceItems as projection on db.InvoiceItems
        where invoice.vendor.assignedManager = $user;

    entity Attachments as projection on db.Attachments
        where invoice.vendor.assignedManager = $user;

    @readonly
    entity ApprovalHistory as projection on db.ApprovalHistory
        where invoice.vendor.assignedManager = $user;
}