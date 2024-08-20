<?php

namespace Piwik\Plugins\ClickHeat;

use Piwik\Plugins\ClickHeat\Model\MysqlModel;

class ClickHeat extends \Piwik\Plugin
{
    public function registerEvents()
    {
        return [
            'AssetManager.getJavaScriptFiles' => 'getJavaScriptFiles',
            'AssetManager.getStylesheetFiles' => 'getStylesheetFiles'
        ];
    }

    public function getJavaScriptFiles(&$files)
    {
        // Füge deine anderen JS-Dateien hinzu
        $files[] = "plugins/ClickHeat/libs/js/admin.js";
        $files[] = "plugins/ClickHeat/libs/js/clickheat.js";
        $files[] = "plugins/ClickHeat/libs/js/clickheat-original.js";
        // Stelle sicher, dass Vue.js zuerst geladen wird, dann dein Plugin-Skript
    }
    public function getStylesheetFiles(&$files)
    {
        $files[] = "plugins/ClickHeat/libs/styles/piwik.css";
        $files[] = "plugins/ClickHeat/libs/styles/clickheat.css";
    }


    public function install()
    {
        /** Create main cache paths */
        $dir = PIWIK_INCLUDE_PATH.'/tmp/cache/clickheat/';
        if (!is_dir($dir.'logs'))
        {
            mkdir($dir.'logs', 0755, true);
        }
        if (!is_dir($dir.'cache'))
        {
            mkdir($dir.'cache', 0755, true);
        }
        $htaccess = PIWIK_INCLUDE_PATH.'/plugins/ClickHeat/dot_htaccess';
        if (file_exists($htaccess)) {
            copy($htaccess, PIWIK_INCLUDE_PATH.'/plugins/ClickHeat/.htaccess');
        }
        MysqlModel::install();
    }

    public function uninstall()
    {
        MysqlModel::uninstall();
    }
}

