<?php
/**
 * Natural Candle Supply
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * @category   Fontis
 * @package    Fontis_Australia
 * @author     Tomas Dermisek
 * @copyright  Copyright (c) 2014 Natural Candle Supply
 * @license    http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

$installer = $this;
$installer->startSetup();

/**
 * Add a customer address attribute to flag a saved address as validated
 *
 */
$installer->run(

    $this->addAttribute(
        'customer_address', 'validated', array(
            'label' => 'Validated',
            'type' => 'int',
            'input' => 'text',
            'position' => 600,
            'visible' => false,
            'required' => false,
            'is_user_defined' => false,
        )
    )
);


$installer->endSetup();
