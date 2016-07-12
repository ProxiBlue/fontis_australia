<?php
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
 * @copyright  Copyright (c) 2014 Fontis Pty. Ltd. (http://www.fontis.com.au)
 * @license    http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/**
 * Controller for address validation requests
 *
 * @category   Fontis
 * @package    Fontis_Australia
 */
class Fontis_Australia_AddressController extends Mage_Core_Controller_Front_Action
{
    /**
     * @var Fontis_Australia_Model_Address_Interface
     */
    protected $client;

    protected function _construct()
    {
        $model = Mage::getStoreConfig('fontis_australia/address_validation/backend');
        $this->setClient($model);
    }

    /**
     * Set the address validation backend client.
     *
     * @param string $client The model alias of the backend client
     */
    public function setClient($client)
    {
        $this->client = Mage::getModel($client);
    }

    /**
     * Sends a request to the address validation backend to validate the address
     * the customer provided on the checkout page.
     */
    public function validateAction()
    {
        // Check for a valid POST request
        if (!$this->getRequest()->isPost()) {
            // Return a "405 Method Not Allowed" response
            $this->getResponse()->setHttpResponseCode(405);
            return;
        }

        $request = $this->getRequest();
        if ($request->getPost('billing')) {
            $data = $request->getPost('billing');
        } else {
            $data = $request->getPost('shipping', array());
        }

        // Check that all of the required fields are present
        if (empty($data)
            || !isset($data['country_id'], $data['region_id'], $data['street'], $data['city'], $data['postcode'])
        ) {
            // Return a "400 Bad Request" response
            $this->getResponse()->setHttpResponseCode(400);
            return;
        }

        $result = $this->doValidation($data);

        if(!array_key_exists('Address',$result)) {
            $result['Address'] = array();
            $list = Mage::app()->getLocale()->getCountryTranslationList();
            $list = array_flip($list);
            $result['Address']['Country'] = array('CountryCode' => $list[$result['country']]);
            $result['Address']['PostCode'] = $result['postcode'];
            $result['Address']['StateOrTerritory'] = $result['state'];
            $result['Address']['SuburbOrPlaceOrLocality'] = $result['suburb'];
            $result['Address']['AddressLine'] = $result['street'][0];
        }
        $this->getResponse()->setHeader('Content-type', 'application/json');
        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));

    }


    /**
     * Validate the adress using the address id.
     * This can be used to validate already (past) addresses in checkout that is selected.
     *
     * @throws Zend_Controller_Response_Exception
     */
    public function validatebyidAction()
    {
        $result = array();
        // Check for a valid POST request
        if (!$this->getRequest()->isPost()) {
            // Return a "405 Method Not Allowed" response
            $this->getResponse()->setHttpResponseCode(405);
            return;
        }
        $request = $this->getRequest();
        if ($request->getParam('billing_address_id')) {
            $address = Mage::getModel('customer/address')->load($request->getParam('billing_address_id'));
            if($address->getId()) {
                $result = $this->doValidation($address->getData());
            }
        } elseif ($request->getParam('shipping_address_id')) {
            $address = Mage::getModel('customer/address')->load($request->getParam('shipping_address_id'));
            if($address->getId()) {
                $result = $this->doValidation($address->getData());
            }
        }

        $this->getResponse()->setHeader('Content-type', 'application/json');

        $this->getResponse()->setBody(Mage::helper('core')->jsonEncode($result));

    }

    private function doValidation($data)
    {

        $country = Mage::getModel('directory/country')->load($data['country_id'])->getName();
        $region = Mage::getModel('directory/region')->load($data['region_id'])->getCode();

        if(!is_array($data['street'])) {
            $data['street'] = (array) $data['street'];
        }

        return $this->client->validateAddress(
            $data['street'],
            $region,
            $data['city'],
            $data['postcode'],
            $country
        );

    }
}
