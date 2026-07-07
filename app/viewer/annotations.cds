using ViewerService as service from '../../srv/viewer-service';

annotate service.Invoices with @(
    UI: {
        SelectionFields: [
            vendor_ID,
            status,
            invoiceDate
        ],

        LineItem: [
            { Value: invoiceNumber, Label: 'Invoice Number' },
            { Value: vendor.vendorName, Label: 'Vendor' },
            { Value: invoiceDate, Label: 'Invoice Date' },
            { Value: dueDate, Label: 'Due Date' },
            { Value: amount, Label: 'Amount' },
            { Value: currency_code, Label: 'Currency' },
            { Value: status, Label: 'Status' }
        ],

        PresentationVariant: {
            SortOrder: [{ Property: invoiceDate, Descending: true }],
            Visualizations: ['@UI.LineItem']
        },

        HeaderInfo: {
            TypeName: 'Invoice',
            TypeNamePlural: 'Invoices',
            Title: { Value: invoiceNumber },
            Description: { Value: vendor.vendorName }
        },

        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                ID: 'GeneralInfo',
                Label: 'General Information',
                Target: '@UI.FieldGroup#GeneralInfo'
            },
            {
                $Type: 'UI.ReferenceFacet',
                ID: 'LineItems',
                Label: 'Line Items',
                Target: 'items/@UI.LineItem'
            },
            {
                $Type: 'UI.ReferenceFacet',
                ID: 'Attachments',
                Label: 'Attachments',
                Target: 'attachments/@UI.LineItem'
            },
            {
                $Type: 'UI.ReferenceFacet',
                ID: 'ApprovalHistory',
                Label: 'Approval History',
                Target: 'approvalHistory/@UI.LineItem'
            }
        ],

        FieldGroup#GeneralInfo: {
            Data: [
                { Value: invoiceNumber, Label: 'Invoice Number' },
                { Value: vendor.vendorName, Label: 'Vendor' },
                { Value: invoiceDate, Label: 'Invoice Date' },
                { Value: dueDate, Label: 'Due Date' },
                { Value: amount, Label: 'Amount' },
                { Value: currency_code, Label: 'Currency' },
                { Value: status, Label: 'Status' },
                { Value: approvedBy, Label: 'Approved By' },
                { Value: approvedAt, Label: 'Approved At' },
                { Value: approvalComments, Label: 'Approval Comments' }
            ]
        }
    },
    Search.searchable: true
) {
    invoiceNumber @Search.defaultSearchElement: true;
};

annotate service.InvoiceItems with @(
    UI.LineItem: [
        { Value: lineNumber, Label: 'Line No' },
        { Value: description, Label: 'Description' },
        { Value: quantity, Label: 'Quantity' },
        { Value: unitPrice, Label: 'Unit Price' },
        { Value: totalAmount, Label: 'Total Amount' }
    ]
);

annotate service.Attachments with @(
    UI.LineItem: [
        { Value: fileName, Label: 'File Name' },
        { Value: fileSize, Label: 'File Size' },
        { Value: mediaType, Label: 'File Type' },
        { Value: uploadedBy, Label: 'Uploaded By' },
        { Value: uploadedAt, Label: 'Uploaded At' }
    ]
) {
    content @Core.MediaType: mediaType;
    content @Core.ContentDisposition.Filename: fileName;
};

annotate service.ApprovalHistory with @(
    UI: {
        LineItem: [
            { Value: action, Label: 'Action' },
            { Value: actorName, Label: 'Actor' },
            { Value: actionAt, Label: 'Timestamp' },
            { Value: comments, Label: 'Comments' }
        ],
        PresentationVariant: {
            SortOrder: [{ Property: actionAt, Descending: false }]
        }
    }
);

// ============================================================
// VENDORS - read-only list (approved vendors only)
// ============================================================
annotate service.Vendors with @(
    UI: {
        SelectionFields: [status, country, currency_code],
        LineItem: [
            { Value: vendorName, Label: 'Vendor Name' },
            { Value: email, Label: 'Email' },
            { Value: phone, Label: 'Phone' },
            { Value: country, Label: 'Country' },
            { Value: currency_code, Label: 'Currency' },
            { Value: status, Label: 'Status' }
        ],
        HeaderInfo: {
            TypeName: 'Vendor',
            TypeNamePlural: 'Vendors',
            Title: { Value: vendorName }
        },
        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                ID: 'VendorGeneralInfo',
                Label: 'General Information',
                Target: '@UI.FieldGroup#VendorGeneralInfo'
            }
        ],
        FieldGroup#VendorGeneralInfo: {
            Data: [
                { Value: vendorName, Label: 'Vendor Name' },
                { Value: email, Label: 'Email' },
                { Value: phone, Label: 'Phone' },
                { Value: address, Label: 'Address' },
                { Value: country, Label: 'Country' },
                { Value: currency_code, Label: 'Currency' },
                { Value: taxId, Label: 'Tax ID' },
                { Value: status, Label: 'Status' }
            ]
        },
        PresentationVariant: {
            SortOrder: [{ Property: vendorName, Descending: false }]
        }
    },
    Search.searchable: true
) {
    vendorName @Search.defaultSearchElement: true;
};