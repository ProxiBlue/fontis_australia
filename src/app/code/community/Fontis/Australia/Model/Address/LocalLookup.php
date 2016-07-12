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
 * Australia Post Delivery Choices address validation backend
 */
class Fontis_Australia_Model_Address_LocalLookup implements Fontis_Australia_Model_Address_Interface
{

    private $_potentials;
    /**
     * Converts the customer provided address data into format that can validate
     *
     * @param array $street Address lines
     * @param string $state Address state
     * @param string $suburb Address city / suburb
     * @param string $postcode Address postcode
     * @param string $country Address country
     *
     * @return array
     */
    public function validateAddress(array $street, $state, $suburb, $postcode, $country)
    {
        $result = array(
            'street' => $street,
            'state' => $state,
            'suburb' => $suburb,
            'postcode' => $postcode,
            'country' => $country
        );

        if(is_array($street)) {
            $result['address_line'] = explode("\n", $street[0]);
            foreach($result['address_line'] as $key => $data) {
                $result['street_line_' . $key] = $data;
            }
        }

        try {
            $result = array_merge($result,$this->getPostcodeValidationResults($state, $suburb, $postcode, $country));
            $result['ValidAustralianAddress'] = true;
        } catch (Exception $e) {
            if(count($this->_potentials) > 0) {
                $result['Potentials'] = $this->_potentials;
            }
            $result['ValidAustralianAddress'] = false;
            Mage::logException($e);
        }

        return $result;
    }

    /**
     * @return array
     */
    public function getPostcodeValidationResults($state, $suburb, $postcode, $country)
    {
        if (strtolower($country) != 'australia') {
            return array();
        }
        $res = Mage::getSingleton('core/resource');
        /* @var $conn Varien_Db_Adapter_Pdo_Mysql */
        $conn = $res->getConnection('australia_read');
        $result = $conn->fetchAll(
            'SELECT au.*, dcr.region_id FROM ' . $res->getTableName('australia_postcode') . ' AS au
             INNER JOIN ' . $res->getTableName('directory_country_region') . ' AS dcr ON au.region_code = dcr.code
             WHERE city = :city AND postcode = :postcode AND region_code = :state  ORDER BY city, region_code, postcode ',
            array('city' => $suburb, 'postcode' => $postcode, 'state' => $state)
        );
        if(count($result) == 0) {
            // lets find some potential matches...
            $result = $conn->fetchAll(
                'SELECT DISTINCT au.*, dcr.region_id FROM ' . $res->getTableName('australia_postcode') . ' AS au
             INNER JOIN ' . $res->getTableName('directory_country_region') . ' AS dcr ON au.region_code = dcr.code
             WHERE (postcode = :postcode)  
             OR (city = :city) 
             OR (city = :city AND postcode = :postcode) 
             OR (postcode = :postcode AND region_code = :state) 
             ORDER BY city, region_code, postcode',
                array('city' => $suburb, 'postcode' => $postcode, 'state' => $state)
            );
            $result = array_unique($result);
            $this->_potentials = $result;
            throw new Exception('Address postcode/state/suburb combination do not match anything','10810');
        }
        return $result;
    }
}
