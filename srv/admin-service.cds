using com.vendor.invoice.management as db from '../db/schema';

@requires: 'Admin'
service AdminService {

    @odata.draft.enabled
    entity Invoices as projection on db.Invoices {
        *,
        virtual null as statusCriticality : Integer,
        virtual null as amountCriticality : Integer,
        virtual null as canSubmit         : Boolean,
        virtual null as canApprove        : Boolean,
        virtual null as canReject         : Boolean,
        virtual null as fieldControl      : Integer
    } actions {
        @Core.OperationAvailable: in.canSubmit
        action submitForApproval() returns Invoices;

        @Core.OperationAvailable: in.canApprove
        action approveInvoice(comments : String(500)) returns Invoices;

        @Core.OperationAvailable: in.canReject
        action rejectInvoice(reason : String(500) not null) returns Invoices;
    };

    entity Vendors as projection on db.Vendors {
        *,
        virtual null as vendorStatusCriticality : Integer
    };

    entity InvoiceItems    as projection on db.InvoiceItems;
    entity Attachments     as projection on db.Attachments;
    entity ApprovalHistory as projection on db.ApprovalHistory;

    @requires: 'Admin'
    action syncVendors() returns {
        total   : Integer;
        created : Integer;
        updated : Integer;
        message : String;
    };
}