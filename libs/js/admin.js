/**
 ** Main functions for administration of ClickHeat
 **
 ** @author Yvan Taviaud - Dugwood - www.dugwood.com
 ** @since 01/04/2007
 **/

var currentAlpha = 80,
    lastDayOfMonth = 0,
    weekDays = [],
    requestedDate = '',
    currentRange = 'd',
    currentWidth = 0,
    pleaseWait = '',
    cleanerRunning = '',
    isJsOkay = '',
    jsAdminCookie = '',
    hideIframes = true,
    hideFlashes = true,
    isPiwikModule = false,
    scriptPath = '',
    scriptIndexPath = '',
    heatmapGenerating = false;

/* Show layout's parameters */
function showRadioLayout() {
    for (var i = 0; i < 7; i += 1) {
        document.getElementById('layout-span-' + i).style.display = (document.getElementById('layout-radio-' + i).checked ? 'block' : 'none');
    }
}

/* Change Alpha on heatmap */
function changeAlpha(alpha) {
    document.getElementById('alpha-level-' + currentAlpha).style.borderTop = '1px solid #888';
    document.getElementById('alpha-level-' + currentAlpha).style.borderBottom = '1px solid #888';
    currentAlpha = alpha;
    document.getElementById('alpha-level-' + currentAlpha).style.borderTop = '2px solid #55b';
    document.getElementById('alpha-level-' + currentAlpha).style.borderBottom = '2px solid #55b';
    for (var i = 0; i < document.images.length; i += 1) {
        if (document.images[i].id.search(/^heatmap-\d+$/) === 0) {
            document.images[i].style.opacity = alpha / 100;
            if (document.body.filters) {
                document.images[i].style.filter = 'alpha(opacity=' + alpha + ')';
            }
        }
    }
}

/* Returns the "top" value of an element */
function getTop(obj) {
    if (obj.offsetParent) {
        return (obj.offsetTop + getTop(obj.offsetParent));
    }
    else {
        return obj.offsetTop;
    }
}

/* Resize the div relative to window height and selected screen size */
function resizeDiv() {
    var oD = document.documentElement && document.documentElement.clientHeight !== 0 ? document.documentElement : document.body,
        iH = oD.innerHeight || oD.clientHeight, iW = oD.innerWidth || oD.clientWidth;
    // document.getElementById('overflowDiv').style.height = (iH < 300 ? 400 : iH) - getTop(document.getElementById('overflowDiv')) + 'px';
    /** Width of main display */
    iW = iW < 300 ? 400 : iW;
    var selectedScreen = cleanInput($('#formScreen').val());
    if (selectedScreen === '0' || selectedScreen === '?') {
        currentWidth = iW;
    } else {
        currentWidth = selectedScreen - 5;
    }
    // document.getElementById('overflowDiv').style.width = currentWidth + 'px';
    document.getElementById('webPageFrame').style.width = currentWidth - 25 + 'px';
}

/* Ajax request to update PNGs */
function updateHeatmap() {
    if (heatmapGenerating) {
        return;
    }
    var screen = 0;
    document.getElementById('pngDiv').innerHTML = '&nbsp;<div style="line-height:20px"><span class="error">' + pleaseWait + '</span></div>';
    var selectedGroup = cleanInput($('#formGroup').val());
    var selectedScreen = cleanInput($('#formScreen').val());
    var selectedBrowser = cleanInput($('#formBrowser').val());
    if (selectedScreen === '0' || selectedScreen === '?') {
        screen = -1 * currentWidth + 25;
    } else {
        screen = selectedScreen;
    }
    var url = scriptIndexPath + 'action=generate&group=' + selectedGroup + '&screen=' + screen + '&browser=' + selectedBrowser + '&date=' + requestedDate + '&range=' + currentRange + '&heatmap=' + (document.getElementById('formHeatmap').checked ? '1' : '0') + '&rand=' + Date();
    heatmapGenerating = true;
    $.get(
        url,
        {},
        function (rs) {
            $('#pngDiv').html(rs.replace(/_JAVASCRIPT_/, isJsOkay));
            $('#webPageFrame').height($('#pngDiv').height());
            $('#overflowDiv').height($('#pngDiv').height());
            changeAlpha(currentAlpha);
            heatmapGenerating = false;
        }
    );

}
/* Ajax request to show group layout */
function showGroupLayout() {
    $.get(
        {},
        function (rs) {
            document.getElementById('layoutDiv').innerHTML = rs;
            document.getElementById('layoutDiv').style.display = 'block';
            showRadioLayout();
        }
    );
}

/* Hide group layout */
function hideGroupLayout() {
    document.getElementById('layoutDiv').style.display = 'none';
    document.getElementById('layoutDiv').innerHTML = '';
}

/* Update JS code in display */
function updateJs() {
    var str = '',
        language = (navigator.language && navigator.language === 'fr' ? 'fr' : 'com'),
        addReturn = document.getElementById('jsShort').checked ? '' : '<br />',
        rand;
    str += '&lt;script type="text/javascript" src="';
    str += scriptPath + 'js/clickheat.js"&gt;&lt;/script&gt;' + addReturn;
    str += '&lt;script type="text/javascript"&gt;&lt;!--<br />';
    str += 'clickHeatSite = ';
    /*jslint regexp: false*/
    /* Piwik form */
    if (isPiwikModule === true) {
        /*global piwik: false */
        str += piwik.idSite;
    }
    else {
        str += '\'<span class="error">' + document.getElementById('jsSite').value.replace(/[^a-z0-9\-_\.]+/gi, '.') + '</span>\'';
    }
    str += ';' + addReturn + 'clickHeatGroup = ';
    str += '\'<span class="error">' + document.getElementById('jsGroup').value.replace(/[^a-z0-9\-_\.]+/gi, '.') + '</span>\'';
    str += ';' + addReturn;
    if (document.getElementById('jsQuota').value !== '0') {
        str += 'clickHeatQuota = <span class="error">' + document.getElementById('jsQuota').value.replace(/[^0-9]*/g, '') + '</span>;' + addReturn;
    }
    /*jslint regexp: true*/
    str += 'clickHeatServer = \'' + piwik.piwik_url + 'index.php?module=ClickHeat&action=click\';' + addReturn;
    str += 'initClickHeat(); //--&gt;<br />';
    str += '&lt;/script&gt;';
    document.getElementById('clickheat-js').innerHTML = str;
}

/* Ajax request to show javascript code */
function showJsCode() {
    $.get(
        scriptIndexPath + 'action=javascript&rand=' + Date(),
        {},
        function (rs) {
            var $layoutDiv = $('#layoutDiv');
            $layoutDiv.html(rs);
            $layoutDiv.css({display: 'block'});
            updateJs();
        }
    );
}

/* Ajax request to get associated group in iframe */
function loadIframe() {
    var selectedGroup = cleanInput($('#formGroup').val());
    $.get(
        scriptIndexPath + 'action=getGroupUrl&group=' + selectedGroup + '&rand=' + Date(),
        {},
        function (rs) {
            if (rs) {
                var webIframe = $('#webPageFrame');
                if (webIframe.prop('src') != rs) {
                    webIframe.prop('src', rs);
                }
            }
            updateHeatmap();
        }
    );
}

/* Show layout's parameters */
function saveGroupLayout() {
    return false;
    // TODO: enable this feature
    var i;
    var selectedGroup = cleanInput($('#formGroup').val());
    for (i = 0; i < 7; i += 1) {
        if (document.getElementById('layout-radio-' + i).checked) {
            break;
        }
    }
    if (i === 7) {
        alert('Error');
        return false;
    }
    var getUrl = scriptIndexPath + 'action=layoutupdate&group=' + selectedGroup + '&url=' + encodeURIComponent(document.getElementById('formUrl').value) + '&left=' + document.getElementById('layout-left-' + i).value + '&right=' + document.getElementById('layout-right-' + i).value + '&center=' + document.getElementById('layout-center-' + i).value + '&rand=' + Date();
    $.get(
        getUrl,
        {},
        function (rs) {
            if (rs == 'OK') {
                alert(rs);
            }
            hideGroupLayout();
            loadIframe();
        }
    );
}

/* Hide iframe's flashes and iframes */
function cleanIframe() {
    var currentIframeContent, currentIframe, newContent, pos, pos2, reg, oldPos, startReg, endReg, found, width, height;
    if (document.getElementById('webPageFrame').src.search('clickempty.html') !== -1) {
        return true;
    }
    if (hideIframes === false && hideFlashes === false) {
        return true;
    }
    try {
        currentIframe = document.getElementById('webPageFrame');
        if (currentIframe.contentDocument) {
            currentIframeContent = currentIframe.contentDocument;
        }
        else if (currentIframe.Document) {
            currentIframeContent = currentIframe.Document;
        }
        /** Hide iframes and flashes content */
        if (!currentIframeContent) {
            return false;
        }
        newContent = currentIframeContent.body.innerHTML;
        oldPos = 0;
        if (hideIframes === false) {
            reg = 'object';
        }
        else {
            if (hideFlashes === false) {
                reg = 'iframe';
            }
            else {
                reg = 'object|iframe';
            }
        }
        startReg = new RegExp('<(' + reg + ')', 'i');
        endReg = new RegExp('<\/(' + reg + ')', 'i');
        while (true) {
            pos = newContent.search(startReg);
            pos2 = newContent.search(endReg);
            if (pos === -1 || pos2 === -1 || pos === oldPos || pos > pos2) {
                break;
            }
            pos2 += 9;
            found = newContent.substring(pos, pos2);
            width = found.match(/width=["']?(\d+)/); // " quote for Zend
            if (width === null) {
                width = [0, 300];
            }
            height = found.match(/height=["']?(\d+)/); // " quote for Zend
            if (height === null) {
                height = [0, 150];
            }
            newContent = newContent.substring(0, pos) + '<span style="margin:0; padding:' + Math.ceil(height[1] / 2) + 'px ' + Math.ceil(width[1] / 2) + 'px; line-height:' + (height[1] * 1 + 10) + 'px; border:1px solid #00f; background-color:#aaf; font-size:0;">Flash/Iframe</span>&nbsp;' + newContent.substring(pos2, newContent.length);
            oldPos = pos;
        }
        currentIframeContent.body.innerHTML = newContent;
    }
    catch (e) {
    }
}

/* Draw alpha selector */
function drawAlphaSelector(obj, max) {
    var str = '', i, grey, alpha;
    for (i = 0; i < max; i += 1) {
        grey = 255 - Math.ceil(i * 255 / max);
        alpha = Math.ceil(i * 100 / max);
        str += '<a href="#" id="alpha-level-' + alpha + '" onclick="changeAlpha(' + alpha + '); this.blur(); return false;" style="font-size:12px; border-top:1px solid #888; border-bottom:1px solid #888;' + (i === 0 ? ' border-left:1px solid #888;' : '') + '' + (i === (max - 1) ? ' border-right:1px solid #888;' : '') + ' text-decoration:none; background-color:rgb(' + grey + ',' + grey + ',' + grey + ');">&nbsp;</a>';
    }
    document.getElementById(obj).innerHTML = str;
    /** Check that currentAlpha exists */
    while (!document.getElementById('alpha-level-' + currentAlpha)) {
        currentAlpha -= 1;
    }
}

/* Ajax request to show javascript code */
function runCleaner() {
    document.getElementById('cleaner').innerHTML = cleanerRunning;
    $.get(
        scriptIndexPath + 'action=cleaner&rand=' + Date(),
        {},
        function (rs) {
            var $cleaner = $('#cleaner');
            if (rs === 'OK') {
                $cleaner.html('');
            }
            else {
                $cleaner.html(rs);
                if (rs.indexOf('JSLint') === -1) {
                    setTimeout(function () {
                        $cleaner.html('');
                    }, 3000);
                }
                else {
                    $cleaner.css({
                        display: 'block',
                        textAlign: 'left',
                        marginTop: '100px'
                    });
                }
            }
        }
    )
}

/* Ajax request to show latest available version */
function showLatestVersion() {
    $.get(
        scriptIndexPath + 'action=latest&rand=' + Date(),
        {},
        function (rs) {
            var $layoutDiv = $('#layoutDiv');
            $layoutDiv.html(rs);
            $layoutDiv.css({display: 'block'})
        }
    );
}

/* Shows main panel */
function showPanel() {
    var div = (isPiwikModule === true ? 'contenu' : 'adminPanel');
    if (document.getElementById(div).style.display !== 'none') {
        return true;
    }
    if (isPiwikModule === true) {
        // document.getElementById('topBars').style.display = 'block';
        // document.getElementById('header').style.display = 'block';
    }
    document.getElementById(div).style.display = 'block';
    document.getElementById('divPanel').innerHTML = '<img src="' + scriptPath + 'images/arrow-up.png" width="11" height="6" alt="" />';
    resizeDiv();
}
/* Hides main panel */
function hidePanel() {
    var div = (isPiwikModule === true ? 'contenu' : 'adminPanel');
    if (isPiwikModule === true) {
        // document.getElementById('topBars').style.display = 'none';
        // document.getElementById('header').style.display = 'none';
    }
    document.getElementById(div).style.display = 'none';
    document.getElementById('divPanel').innerHTML = '<img src="' + scriptPath + 'images/arrow-down.png" width="11" height="6" alt="" />';
    resizeDiv();
}

/* Reverse the state of the admin cookie (used not to log the clicks for admin user) */
function adminCookie() {
    if (confirm(jsAdminCookie)) {
        document.cookie = 'clickheat-admin=; expires=Fri, 27 Jul 2001 01:00:00 UTC; path=/';
    }
    else {
        var date = new Date();
        date.setTime(date.getTime() + 365 * 86400 * 1000);
        document.cookie = 'clickheat-admin=1; expires=' + date.toGMTString() + '; path=/';
    }
}

function applyChange() {
    resizeDiv();
    loadIframe();
}

function cleanInput(value) {
    return typeof(value) != 'undefined' && value.indexOf('string:') == 0 ? value.replace('string:', '') : value;
}