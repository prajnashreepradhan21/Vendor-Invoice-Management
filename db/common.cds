namespace com.vendor.invoice.management;

type Email : String(255);
type Phone : String(20);
type TaxID : String(50);
type InvoiceNumber : String(30);
type Amount : Decimal(15,2);

type VendorStatus : String enum {
    PENDING;
    APPROVED;
    SUSPENDED;
    DELETED;
}

type InvoiceStatus : String enum {
    DRAFT;
    SUBMITTED;
    APPROVED;
    REJECTED;
    PAID;
}

type ApprovalAction : String enum {
    SUBMITTED;
    APPROVED;
    REJECTED;
}