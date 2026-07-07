using AdminService as service from '../../srv/admin-service';

annotate service.Invoices with @(
    UI: {
        SelectionFields: [
            vendor_ID,
            status,
            invoiceDate,
            amount
        ],

        LineItem: [
            { Value: invoiceNumber, Label: 'Invoice Number' },
            { Value: vendor.vendorName, Label: 'Vendor' },
            { Value: invoiceDate, Label: 'Invoice Date' },
            { Value: dueDate, Label: 'Due Date' },
            {
                Value: amount,
                Label: 'Amount',
                Criticality: amountCriticality,
                CriticalityRepresentation: #WithIcon
            },
            { Value: currency_code, Label: 'Currency' },
            {
                Value: status,
                Label: 'Status',
                Criticality: statusCriticality,
                CriticalityRepresentation: #WithIcon
            }
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

        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#StatusInfo',
                Label: 'Status'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#VendorInfo',
                Label: 'Vendor'
            }
        ],

        FieldGroup#StatusInfo: {
            Data: [
                { Value: status, Criticality: statusCriticality, CriticalityRepresentation: #WithIcon },
                { Value: createdBy, Label: 'Created By' },
                { Value: createdAt, Label: 'Created At' },
                { Value: submittedBy, Label: 'Submitted By' },
                { Value: submittedAt, Label: 'Submitted At' },
                { Value: approvedBy, Label: 'Approved By' },
                { Value: approvedAt, Label: 'Approved At' },
                { Value: rejectedBy, Label: 'Rejected By' },
                { Value: rejectedAt, Label: 'Rejected At' }
            ]
        },

        FieldGroup#VendorInfo: {
            Data: [
                {
                    $Type: 'UI.DataFieldWithNavigationPath',
                    Value: vendor.vendorName,
                    Label: 'Vendor',
                    Target: vendor
                },
                { Value: vendor.status, Label: 'Vendor Status' },
                { Value: vendor.country, Label: 'Country' }
            ]
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
                { Value: vendor_ID, Label: 'Vendor' },
                { Value: invoiceDate, Label: 'Invoice Date' },
                { Value: dueDate, Label: 'Due Date' },
                { Value: amount, Label: 'Amount', Criticality: amountCriticality, CriticalityRepresentation: #WithIcon },
                { Value: currency_code, Label: 'Currency' }
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AdminService.submitForApproval',
                Label: 'Submit for Approval',
                Inline: true
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AdminService.approveInvoice',
                Label: 'Approve',
                Inline: true
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AdminService.rejectInvoice',
                Label: 'Reject',
                Inline: true
            }
        ]
    },
    Search.searchable: true
) {
    vendor @(
        Common.ValueList: {
            CollectionPath: 'Vendors',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: vendor_ID, ValueListProperty: 'ID' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'vendorName' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'country' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'email' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'status' }
            ]
        },
        Common.Text: vendor.vendorName,
        Common.Text.@UI.TextArrangement: #TextOnly
    );

    vendor_ID @(
        Common.Label: 'Vendor',
        Common.FieldControl: fieldControl
    );

    invoiceNumber @(
        Common.Label: 'Invoice Number',
        Search.defaultSearchElement: true
    );

    invoiceDate   @(Common.Label: 'Invoice Date', Common.FieldControl: fieldControl);
    dueDate       @(Common.Label: 'Due Date', Common.FieldControl: fieldControl);
    amount        @(Common.Label: 'Amount', Common.FieldControl: fieldControl);
    currency_code @(Common.Label: 'Currency', Common.FieldControl: fieldControl);
    status        @(Common.Label: 'Status', Common.FieldControl: #ReadOnly);

    createdBy   @Common.Label: 'Created By';
    createdAt   @Common.Label: 'Created At';
};

annotate service.InvoiceItems with @(
    UI.LineItem: [
        { Value: lineNumber, Label: 'Line No' },
        { Value: description, Label: 'Description' },
        { Value: quantity, Label: 'Quantity' },
        { Value: unitPrice, Label: 'Unit Price' },
        { Value: totalAmount, Label: 'Total Amount' }
    ]
) {
    totalAmount @Common.FieldControl: #ReadOnly;
};

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
// VENDORS - list page + search + Sync Vendors from S/4HANA button
// ============================================================
// ============================================================
// VENDORS - list page + search + Sync Vendors from S/4HANA button
// ============================================================
annotate service.Vendors with @(
    UI: {
        SelectionFields: [vendorName, status, country, currency_code],
        LineItem: [
            { Value: vendorName, Label: 'Vendor Name' },
            { Value: email, Label: 'Email' },
            { Value: phone, Label: 'Phone' },
            { Value: country, Label: 'Country' },
            { Value: currency_code, Label: 'Currency' },
            { Value: taxId, Label: 'Tax ID' },
            {
                Value: status,
                Label: 'Status',
                Criticality: vendorStatusCriticality,
                CriticalityRepresentation: #WithIcon
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AdminService.syncVendors',
                Label: 'Sync Vendors from S/4HANA'
            }
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
    email      @Search.defaultSearchElement: true;
};