<?php

/**
 * Piwik - free/libre analytics platform
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 *
 */

namespace Piwik\Plugins\ClickHeat\Widgets;

use Piwik\Common;
use Piwik\Container\StaticContainer;
use Piwik\Piwik;
use Piwik\Plugins\ClickHeat\Adapter\HeatmapAdapterInterface;
use Piwik\Plugins\ClickHeat\Config;
use Piwik\Plugins\ClickHeat\Utils\Helper;
use Piwik\Widget\Widget;
use Piwik\Widget\WidgetConfig;
##use Piwik\Config;
use Piwik\View;
use Piwik\DI;
use Piwik\SettingsPiwik;
use Piwik\View\SecurityPolicy;

class GetClickHeatMenu extends Widget
{
    /**
     * @var HeatmapAdapterInterface
     */
    protected $adapter;
    protected $securityPolicy;
    public function __construct(SecurityPolicy $securityPolicy)
    {
	$this->securityPolicy = $securityPolicy;
	try 
	{
          $this->adapter = StaticContainer::get(Config::get('adapter'));
	}
	catch (\Exception $e) 
	{
          error_log('Failed to get adapter: ' . $e->getMessage());
          throw $e; // Re-throw the exception after logging it
    	}
    }

    /**
     * @param WidgetConfig $config
     */
    public static function configure(WidgetConfig $config)
    {
        $config->setCategoryId('General_Visitors');
        $config->setSubcategoryId('Click Heat');
        $config->setName('ClickHeat_CLICK_HEAT_MENU');
        $config->setOrder(99);
        \Piwik\Piwik::checkUserIsNotAnonymous();
        $config->setIsEnabled(true);
        $config->setIsNotWidgetizable();
    }

    /**
     * @return string
     */
    public function render()
    {
	$this->securityPolicy->overridePolicy('frame-src',CLICKHEAT_PATH);
	try 
	{
        Config::init();
        $conf = Config::all();
        $idSite = (int) Common::getRequestVar('idSite');
        if (Piwik::checkUserHasViewAccess($idSite) === false) {
            return false;
        }

        $__selectScreens = [];
        foreach ($conf['__screenSizes'] as $screenSize) {
            $__selectScreens[$screenSize] = ($screenSize === 0 ? Piwik::translate('ClickHeat_LANG_ALL') : $screenSize . 'px');
        }

        $__selectBrowsers = [];
        foreach ($conf['__browsersList'] as $label => $name) {
            $__selectBrowsers[$label] = $label === 'unknown' ? Piwik::translate('ClickHeat_LANG_UNKNOWN') : $name;
        }
        $__selectBrowsers['all'] = Piwik::translate('ClickHeat_LANG_ALL');

        $groups = $this->adapter->getGroups($idSite);
        $view = new View('@ClickHeat/view');
        $port = Helper::getServerPort();
        $data = [
            'clickheat_host'          => \Piwik\Config::getInstance()->General['trusted_URL_hosts'],
            'clickheat_path'          => CLICKHEAT_PATH,
            'clickheat_index'         => CLICKHEAT_INDEX_PATH,
            'clickheat_groups'        => $groups,
            'clickheat_browsers'      => $__selectBrowsers,
            'clickheat_screens'       => $__selectScreens,
            'clickheat_loading'       => str_replace('\'', '\\\'', Piwik::translate('ClickHeat_LANG_ERROR_LOADING')),
            'clickheat_cleaner'       => str_replace('\'', '\\\'', Piwik::translate('ClickHeat_LANG_CLEANER_RUNNING')),
            'clickheat_admincookie'   => str_replace('\'', '\\\'', Piwik::translate('ClickHeat_LANG_JAVASCRIPT_ADMIN_COOKIE')),
            'clickheat_alpha'         => $conf['alpha'],
            'clickheat_iframes'       => $conf['hideIframes'] === true ? 'true' : 'false',
            'clickheat_flashes'       => $conf['hideFlashes'] === true ? 'true' : 'false',
            'clickheat_force_heatmap' => $conf['heatmap'] === true ? ' checked="checked"' : '',
            'clickheat_jsokay'        => str_replace('\'', '\\\'', Piwik::translate('ClickHeat_LANG_ERROR_JAVASCRIPT')),
            'clickheat_range'         => Common::getRequestVar('period'),
            'clickheat_date'          => Common::getRequestVar('date'),
        ];
        $view->assign($data);
        return $view->render();
    } 
    catch (\Exception $e) 
    {
        error_log('Error rendering ClickHeat widget: ' . $e->getMessage());
        return 'Error rendering widget';
    }
  }
}

