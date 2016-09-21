## Spince Links

Spince is a free clickbait blocker that compares the relevance of link text to the text on the actual linked page.

![alt text](http://links.spince.com/img/hackerDemo1.gif "Demo")

## Installation

You can install Spince Links from the Chrome Web Store via <https://chrome.google.com/webstore/detail/ekidgogoamlmlmlccoghgbfamckinogm/>.

## Features

The clickbait tool uses a term frequency (TF) statistical algorithm to score the relevance of the link text compared against the text that is shown on the actual linked page. The rationale is that a relevant (i.e. non-clickbait) link would have its text appear frequently on the actual page.

<ul>
<li>A green circle indicates a likely relevant link</li>
<li>A red square indicates a possible clickbait link</li>
<li>A dashed line indicates the link wasn't analyzed</li>
<li>Only text based pages are analyzed</li>
<li>Only links of certain length are analyzed</li>
<li>Spince also extracts a key sentence as popover</li>
<li>Ships with customizable blacklist to stop execution</li>
<li>Major sites like gmail and aws on blacklist</li>
<li>Exclude any link to prevent analysis</li>
<li>Multiple Languages (non-English)</li>
<li>Enhanced algorithm under development</li>
<li>No browsing data sent to Spince Links</li>
</ul>

## Usage Tips

Spince ships with a blacklist that prevents the tool from running on certain sites. These sites include gmail.com, aws, ebay, and other prominent sites. You can find the full list within the spince.js file. Note that you can add or remove any site from the blacklist by clicking on the spince icon in the browser bar and then selecting your action.

You can also prevent a link from being analyzed. This is different from the blacklist. The blacklist prevents Spince from analyzing all links on a certain website. Basically, the blacklist is an off-on switch. You can also selectively manage links on a page. To prevent a link from being analyzed, you would click the Manage Links button from the Spince icon popup. When prompted you enter the domain name you want to manage.

As an example, suppose you want to prevent all links for the www.example.com from being analyzed. You enter this domain in the Manage Link -> Exclude Link section of the Spince popup (in the browser toolbar). Then Spince will skip over any links that have the www.example.com domain.

## Additional Notes

A premium version with an enhanced algorithm is under development. New features and pull requests are appreciated. There are also plans to build Spince for other platforms (Firefox, Safari, mobile).

The tool currently works for English, Spanish, German, French, and Italian. More languagues can be requested or implemented via pull requests.
