namespace com.vendor.invoice.management;

using { cuid, managed, Currency } from '@sap/cds/common';
using {
    com.vendor.invoice.management.VendorStatus,
    com.vendor.invoice.management.InvoiceStatus,
    com.vendor.invoice.management.ApprovalAction
} from './common';

entity Vendors : cuid, managed {

    vendorName        : String(100) @mandatory;
    email             : String(100);
    phone             : String(20);
    address           : String(255);
    country           : String(50);
    currency          : Currency;
    taxId             : String(30);
    externalSystemId  : String(40);
    assignedManager   : String(100);

    status            : VendorStatus default 'PENDING';

    invoices : Composition of many Invoices
               on invoices.vendor = $self;
}

entity Invoices : cuid, managed {

    invoiceNumber     : String(30) @mandatory;

    vendor            : Association to Vendors @mandatory;

    invoiceDate       : Date @mandatory;

    dueDate           : Date @mandatory;

    amount            : Decimal(15,2) @mandatory;

    currency          : Currency;

    status            : InvoiceStatus default 'DRAFT';

    submittedBy       : String(100);
    submittedAt       : Timestamp;

    approvedBy        : String(100);
    approvedAt        : Timestamp;
    approvalComments  : String(500);

    rejectedBy        : String(100);
    rejectedAt        : Timestamp;
    rejectionReason   : String(500);

    paidAt            : Timestamp;

    items : Composition of many InvoiceItems
            on items.invoice = $self;

    attachments : Composition of many Attachments
                  on attachments.invoice = $self;

    approvalHistory : Composition of many ApprovalHistory
                      on approvalHistory.invoice = $self;
}

entity InvoiceItems : cuid, managed {

    invoice      : Association to Invoices @mandatory;

    lineNumber   : Integer @mandatory;

    description  : String(255) @mandatory;

    quantity     : Decimal(10,2) @mandatory;

    unitPrice    : Decimal(15,2) @mandatory;

    totalAmount  : Decimal(15,2) @readonly;
}

entity Attachments : cuid, managed {

    invoice      : Association to Invoices @mandatory;

    fileName     : String(255) @mandatory;

    fileSize     : Integer;

    mediaType    : String(100);

    content      : LargeBinary;

    uploadedBy   : String(100);

    uploadedAt   : Timestamp;
}

entity ApprovalHistory : cuid, managed {

    invoice      : Association to Invoices @mandatory;

    action       : ApprovalAction @mandatory;

    actorName    : String(100);

    actorId      : String(100);

    actionAt     : Timestamp;

    comments     : String(500);
}