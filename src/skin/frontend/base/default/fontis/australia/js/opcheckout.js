/**
 * Fontis Australia Extension
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 *
 * @category   Fontis
 * @package    Fontis_Australia
 * @author     Thai Phan
 * @author     Jeremy Champion
 * @copyright  Copyright (c) 2014 Fontis Pty. Ltd. (http://www.fontis.com.au)
 * @license    http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/**
 * Returns the ID of a region using the region code
 */
function getRegionId(regionCode, progress) {
    for (var regionId in australiaCountryRegions.AU) {
        if (!australiaCountryRegions.AU.hasOwnProperty(regionId)) {
            continue;
        }
        if (australiaCountryRegions.AU[regionId].code == regionCode) {
            return regionId;
        }
    }
    return $(progress + ':region_id').value;
}

function validateAddress(progress, section) {
    checkout.setLoadWaiting(progress);
    var request = new Ajax.Request(
        section.saveUrl,
        {
            method: 'post',
            onComplete: section.onComplete,
            onSuccess: section.onSave,
            onFailure: checkout.ajaxFailure.bind(checkout),
            parameters: Form.serialize(section.form)
        }
    );
}

var addressValidationModal;
function createModal(title, content) {
    var settings = {
        draggable: false,
        resizable: false,
        closable: true,
        className: "magento",
        windowClassName: "address-validator",
        title: title,
        top: 40,
        width: 520,
        zIndex: 1000,
        recenterAuto: false,
        hideEffect: Element.hide,
        showEffect: Element.show,
        id: "address-validator-window"
    };
    addressValidationModal = Dialog.info(content, settings);
}

function save(progress, section) {
    if (checkout.loadWaiting !== false) {
        return;
    }
    var validator = new Validation(section.form);
    if (validator.validate()) {
        checkout.setLoadWaiting(progress);
        if ($(progress + '-new-address-form').visible() && $(progress + ':country_id').value == 'AU') {
            new Ajax.Request(
                addressValidationUrl,
                {
                    method: 'post',
                    onComplete: section.onComplete,
                    onSuccess: function (transport) {
                        self.success(transport, progress, section);
                    },
                    onFailure: checkout.ajaxFailure.bind(checkout),
                    parameters: Form.serialize(section.form)
                }
            );
        } else if (validateAddressById) {
            new Ajax.Request(
                addressValidationUrlById,
                {
                    method: 'post',
                    parameters: Form.serialize(section.form),
                    onComplete: section.onComplete,
                    onSuccess: function (transport) {
                        self.success(transport, progress, section);
                    },
                    onFailure: checkout.ajaxFailure.bind(checkout)

                }
            );
        } else {
            validateAddress(progress, section);
        }
    }
}

function success(transport, progress, section) {
    var response = transport.responseText.evalJSON();
    if (response.ValidAustralianAddress) {
        var params = transport.request.parameters;
        if(response.Address) {
            var validStreet = response.Address.AddressLine;
            var validCountry = response.Address.Country.CountryCode;
            var validPostcode = response.Address.PostCode;
            var validRegion = response.Address.StateOrTerritory;
            var validCity = response.Address.SuburbOrPlaceOrLocality;
        } else {
            var validStreet = response.address_line.join();
            var validCountry = response.country
            var validPostcode = response.postcode;
            var validRegion = response.state;
            var validCity = response.suburb;
        }

            var validAddress = validStreet + ', ' + validCity + ', ' + validRegion + ' ' + validPostcode + ', ' + validCountry;

        var invalidAddress = false;
        if (
            params[progress + '[city]'] != validCity ||
            australiaCountryRegions[params[progress + '[country_id]']][params[progress + '[region_id]']].code != validRegion ||
            params[progress + '[postcode]'] != validPostcode
        ) {
            invalidAddress = true;
        }
        if (invalidAddress) {
            var addressSuggest = addressSuggestTemplate;
            addressSuggest = addressSuggest.replace('Provided Address', address);
            addressSuggest = addressSuggest.replace('Validated Address', validAddress);
            addressSuggest = addressSuggest.replace('submit-valid-x-address', 'submit-valid-' + progress + '-address');
            addressSuggest = addressSuggest.replace('submit-user-x-address', 'submit-user-' + progress + '-address');
            addressSuggest = addressSuggest.replace('cancel-x-address', 'cancel-' + progress + '-address');
            createModal('Address Validation', addressSuggest);

            // Put observers on the buttons in the modal
            $('submit-valid-' + progress + '-address').observe('click', function () {
                addressValidationModal.close();
                $(progress + ':street1').value = validStreet;
                $(progress + ':street2').value = '';
                $(progress + ':city').value = validCity;
                $(progress + ':region_id').value = getRegionId(validRegion, progress);
                $(progress + ':postcode').value = validPostcode;
                validateAddress(progress, section);
            });

            $('submit-user-' + progress + '-address').observe('click', function () {
                addressValidationModal.close();
                validateAddress(progress, section);
            });

            $('cancel-' + progress + '-address').observe('click', function () {
                addressValidationModal.close();
            });
        } else {
            validateAddress(progress, section);
        }
    } else if (response.Potentials) {
        var addressPotential = addresspotentialsTemplate;
        var div = document.createElement("div");
        div.className = "input-box";
        var select = document.createElement("select");
        select.id = "potential_address_list";
        select.name = "potential_address";
        select.className = "address-select";
        select.style.padding = "5px";
        response.Potentials.each(function (item) {
            var el = document.createElement("option");
            el.textContent = item['city'] + ', ' + item['postcode'] + ', ' + item['region_code'];
            el.value = JSON.stringify(item);
            select.appendChild(el);
        });
        div.appendChild(select);
        addressPotential = addressPotential.replace('Potential Address', div.outerHTML);
        var address = response.address_line.join() + ', ' + response.suburb + ', ' + response.postcode + ' ' + response.state;
        addressPotential = addressPotential.replace('Address_Type', progress);
        addressPotential = addressPotential.replace('Incorrect Address', address);
        addressPotential = addressPotential.replace('submit-valid-x-address', 'submit-valid-' + progress + '-address');
        addressPotential = addressPotential.replace('submit-user-x-address', 'submit-user-' + progress + '-address');
        addressPotential = addressPotential.replace('cancel-invalid-x-address', 'cancel-' + progress + '-address');
        createModal('Address Validation', addressPotential);
        // do chosen
        // fix any chosen elements
        jQuery("select").chosen(
            {
                disable_search_threshold: 10,
                no_results_text: "Sorry, nothing found!",
                width: "84%",
                inherit_select_classes: true

            });
        // Put observers on the buttons in the modal
        $('submit-valid-' + progress + '-address').observe('click', function () {
            addressValidationModal.close();
            validateAddress(progress, section);
        });
        $('submit-user-' + progress + '-address').observe('click', function () {
            var e = document.getElementById("potential_address_list");
            var address = JSON.parse(e.options[e.selectedIndex].value);
            addressValidationModal.close();
            $(progress + '-new-address-form').show();
            var xx = 1;
            response.address_line.each(function (item) {
                $(progress + ':street' + xx).value = item;
                xx++;
            });
            $(progress + ':city').value = address.city;
            $(progress + ':region_id').value = getRegionId(address.region_code, progress);
            $(progress + ':postcode').value = address.postcode;
            $(progress + ':save_in_address_book').checked = true;
            // unselect the selected address
            document.getElementById(progress + "-address-select").selectedIndex = -1;
            // fix any chosen elements
            jQuery("select").trigger("chosen:updated");
        });
        $('cancel-' + progress + '-address').observe('click', function () {
            addressValidationModal.close();
            $(progress + '-new-address-form').show();
            var xx = 0;
            response.address_line.each(function (item) {
                $(progress + ':street' + xx).value = item;
                xx++;
            });
            $(progress + ':city').value = city;
            $(progress + ':region_id').value = getRegionId(region, progress);
            $(progress + ':postcode').value = postcode;
            $(progress + ':save_in_address_book').checked = true;
            // unselect the selected address
            document.getElementById(progress + "-address-select").selectedIndex = -1;
            // fix any chosen elements
            jQuery("select").trigger("chosen:updated");
        });

    } else {
        var street_line_1 = response.address_line_1;
        var street_line_2 = '';
        if (response.address_line_2) {
            var street_line_2 = response.address_line_2;
        }
        var postcode = response.postcode;
        var region = response.state;
        var city = response.suburb;
        var address = city + ', ' + region + ' ' + postcode;
        var addressFailure = addressFailureTemplate;
        addressFailure = addressFailure.replace('Incorrect Address', address);
        addressFailure = addressFailure.replace('submit-invalid-x-address', 'submit-invalid-' + progress + '-address');
        addressFailure = addressFailure.replace('cancel-invalid-x-address', 'cancel-invalid-' + progress + '-address');
        createModal('Address Validation', addressFailure);

        // Put observers on the buttons in the modal
        $('submit-invalid-' + progress + '-address').observe('click', function () {
            addressValidationModal.close();
            validateAddress(progress, section);
        });

        $('cancel-invalid-' + progress + '-address').observe('click', function () {
            addressValidationModal.close();
        });

        $('edit-invalid-' + progress + '-address').observe('click', function () {
            addressValidationModal.close();
            $(progress + '-new-address-form').show();
            $(progress + ':street1').value = street_line_1;
            $(progress + ':street2').value = street_line_2;
            $(progress + ':city').value = city;
            $(progress + ':region_id').value = getRegionId(region, progress);
            $(progress + ':postcode').value = postcode;
            // unselect the selected address
            document.getElementById(progress + "-address-select").selectedIndex = -1;
            // fix any chosen elements
            jQuery("select").trigger("chosen:updated");

        });
    }
}

Billing.prototype.save = function () {
    save('billing', this);
};

Shipping.prototype.save = function () {
    save('shipping', this);
};
