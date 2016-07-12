Fontis Australia Extension
==========================

This extension provides essential functionality for Australian stores, including Australia Post shipping, direct deposit and BPAY payment methods, and adds Australian regions and postcodes.

Further documentation is available from the [Fontis Australia Extension](http://www.fontis.com.au/magento/extensions/australia) page on our website.

As of 2.4.0 we added support for Multi Warehouse Extension in the eParcel Shipping Method. The eParcel rates can be specified for each of the Warehouse separately (eg. from Sydney - Warehouse ID = 1, from Melbourne Warehouse ID = 2).  

The import file for eParcel rates can have one additional column for the Warehouse ID (called stock_id in code). The complete import file structure:
"Country", "Region/State", "Postcodes", "Weight from", "Weight to", "Parcel Cost", "Cost Per Kg", "Delivery Type", "Charge Code Ind", "Charge Code Bus", "Warehouse ID"

Leave Warehouse ID empty when not using Multi Warehouse Extension. 

Local Postcode + Suburb + State validation backend
==================================================

You can enable this option in admin, under the Fontis Australia settings. Address Validation=>Backend
When enabled address entry at checkout will be validated on a match of postcode , suburb and state.
If an exact match to the entered address is not found, combinations of the entered values will be used to build a potentials list.

The client will thereafter be prompted to use one of the potential entries, edit current entry, or to continue using the entered address

An additional setting is to validate saved addresses.
When a saved address is used at checkout, the same validation process applies.
If the client chooses to chnage the address, a new address entry will be created, and set as the default.
The previous address will remain in teh client address book, and will not be automatically deleted.
Saved addresses will only be validated once. Addresses that are validated a checkout, will not be validated again.

