<?php
/**
 * ClickHeat - Clicks' heatmap
 *
 * @link http://www.dugwood.com/clickheat/index.html
 * @license http://www.gnu.org/licenses/gpl-3.0.html Gpl v3 or later
 * @author YAMAMOTO Takashi - yamachan@piwikjapan.org
 * @since 2015/4/16
 * @version $Id: 0aea8d2d84ea9ccba54ca1d4c22f0b6a8063269d $
 *
 * @package Piwik\Plugins\ClickHeat
 */

namespace Piwik\Plugins\ClickHeat;

use Piwik\Menu\MenuReporting;

class Menu extends \Piwik\Plugin\Menu
{
    public function configureReportingMenu(MenuReporting $menu)
    {
        $menu->addVisitorsItem('ClickHeat', array('module' => 'ClickHeat', 'action' => 'view'), 1);
    }
}

