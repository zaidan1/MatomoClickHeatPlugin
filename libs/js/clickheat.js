function addEvtListener(element, event, handler) 
{
    if (document.addEventListener) 
    {
        (element || document).addEventListener(event, handler, false);
    }
    else if (attachEvent) 
    {
        (element || document).attachEvent("on" + event, handler);
    }
}

function catchClickHeat(event) 
{
    try 
    {
        if (clickHeatQuota === 0 || clickHeatGroup === "") return true;

        event = event || window.event;
        var button = event.which || event.button;
        var element = event.srcElement || event.target;
        if (button === 0) return true;

        if (element && element.tagName.toLowerCase() === "iframe") 
	{
            if (element.sourceIndex === clickHeatLastIframe) return true;
            clickHeatLastIframe = element.sourceIndex;
        } 
	else 
	{
            clickHeatLastIframe = -1;
        }

        var clientX = event.clientX;
        var clientY = event.clientY;
        var docWidth = document.documentElement.clientWidth || window.innerWidth;
        var docHeight = document.documentElement.clientHeight || window.innerHeight;
        var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;
        var docMaxWidth = Math.max(document.documentElement.scrollWidth, document.documentElement.offsetWidth, docWidth);
        var docMaxHeight = Math.max(document.documentElement.scrollHeight, document.documentElement.offsetHeight, docHeight);

        if (clientX > docWidth || clientY > docHeight) return true;
        clientX += scrollX;
        clientY += scrollY;
        if (clientX < 0 || clientY < 0 || clientX > docMaxWidth || clientY > docMaxHeight) return true;

        var currentTime = new Date().getTime();
        if (currentTime - clickHeatTime < 1000) return true;
        clickHeatTime = currentTime;

        if (clickHeatQuota > 0) clickHeatQuota--;

        var clickData = 
	{
            s: clickHeatSite,
            g: clickHeatGroup,
            x: clientX,
            y: clientY,
            w: docWidth,
            b: clickHeatBrowser,
            button: button,
            time: currentTime
        };

        var storedClicks = JSON.parse(localStorage.getItem('clickHeatData')) || [];
        storedClicks.push(clickData);
        localStorage.setItem('clickHeatData', JSON.stringify(storedClicks));
    } 
    catch (e) 
    {
        console.error("An error occurred while processing click: ", e.message);
    }
    return true;
}

function sendClickData(event) 
{
    try 
    {
        var storedClicks = JSON.parse(localStorage.getItem('clickHeatData')) || [];
        if (storedClicks.length === 0) return;

        // Prepare the array of clicks
        var clicksArray = [];
        for (var i = 0; i < storedClicks.length; i++) 
	{
            var click = storedClicks[i];var clickData = `{"s": ${click.s},"g": "${click.g}","x": ${click.x},"y": ${click.y},"w": ${click.w},"b": "${click.b}","button": ${click.button},"time": ${click.time}}`;
            clicksArray.push(clickData);
        }

        // Combine the clicks into a single JSON object
        var jsonData = `{"clicks": [${clicksArray.join(',')}]}`;

        // Encode the JSON data for URL parameters
        var params = encodeURIComponent(jsonData);

        // Construct the URL with the encoded data
	var url = clickHeatServer + (clickHeatServer.indexOf("?") !== -1 ? "&" : "?") +'Clicks='+ params;

        // Create an image element to make the GET request
        var img = new Image();
        img.src = url;
	console.log(url);
        //event.preventDefault();
        // Remove the stored clicks after sending
        localStorage.removeItem('clickHeatData');
    } 
    catch (e) 
    {
        event.preventDefault();
        console.error("An error occurred while sending click data: ", e.message);
    }
}

function initClickHeat() {
    if (clickHeatGroup === "" || clickHeatServer === "") return false;

    var baseUrl = document.location.protocol + "//" + document.location.host;
    if (clickHeatServer.indexOf(baseUrl) === 0) {
        clickHeatServer = clickHeatServer.substring(baseUrl.length);
    }

    addEvtListener(document, "mousedown", catchClickHeat);

    document.addEventListener('focus', function(event) {
        if (event.target.tagName.toLowerCase() === 'iframe') {
            catchClickHeat(event);
        }
    }, true);

    var userAgent = navigator.userAgent ? navigator.userAgent.toLowerCase().replace(/-/g, "") : "";
    var browsers = ["chrome", "firefox", "safari", "msie", "opera"];
    for (var j = 0; j < browsers.length; j++) {
        if (userAgent.indexOf(browsers[j]) !== -1) {
            clickHeatBrowser = browsers[j];
            break;
        }
    }

    window.addEventListener('beforeunload', sendClickData);
}

var clickHeatGroup = "";
var clickHeatSite = "";
var clickHeatServer = "";
var clickHeatLastIframe = -1;
var clickHeatTime = 0;
var clickHeatQuota = -1;
var clickHeatBrowser = "";
var clickHeatWait = 500;
initClickHeat();

