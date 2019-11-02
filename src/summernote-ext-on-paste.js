/* https://github.com/malloryCode/summernote-on-paste */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'));
    } else {
        factory(window.jQuery);
    }
}
    (function ($) {
        $.extend(true, $.summernote.lang, {
            'en-US': {
                onPaste: {
                    success: 'Pasted text has been processed!',
                    allElementsRemoved: 'Pasted text contains only disallowed elements! Nothing pasted.',
                    unknownError : 'Unexpected error. Error message logged to the console.'
                }
            },
            'es-ES': {
                onPaste: {
                    success: '¡El texto pegado ha sido procesado!',
                    allElementsRemoved: '¡El texto pegado contiene solo elementos no permitidos! Nada pegado.',
                    unknownError: 'Error inesperado. Mensaje de error registrado en la consola.'
                }
            },
            'fr-FR': {
                onPaste: {
                    success: 'Le texte collé a été traité!',
                    allElementsRemoved:'Le texte collé ne contient que des éléments interdits! Rien collé.',
                    unknownError: 'Error inesperado. Mensaje de error registrado en la consola.'
                }
            }
        });
        $.extend($.summernote.options, {
            onPaste: {
                whiteList: {
                    "allowedTags": [
                        "h1",
                        "h2",
                        "h3",
                        "h4",
                        "h5",
                        "h6",
                        "blockquote",
                        "ol",
                        "ul",
                        "li",
                        "p",
                        "div",
                        "span",
                        "table",
                        "thead",
                        "tbody",
                        "tfoot",
                        "tr",
                        "th",
                        "td",
                        "b",
                        "strong",
                        "em",
                        "i",
                        "u",
                        "a",
                        "img"
                    ],
                    "requiresAttributes": [
                        "img",
                        "a"
                    ],
                    "allowedAttributes": {
                        "img": [
                            "src",
                            "alt",
                            "height",
                            "width"
                        ],
                        "a": [
                            "href",
                            "target",
                            "name"
                        ],
                        "table": [
                            "class"
                        ],
                        "th": [
                            "colspan",
                            "rowspan"
                        ],
                        "td": [
                            "colspan",
                            "rowspan"
                        ],
                        "span": [
                            "class"
                        ]
                    },
                    "styleTagAllowedIn": {
                        "span": [
                            "text-decoration"
                        ]
                    }
                }
            }
        });
        $.extend($.summernote.plugins, {
            'onPaste': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    options = context.options,
                    lang = options.langInfo,
                    nodeTypeElement = 1,
                    nodeTypeAttribute = 2,
                    nodeTypeText = 3,
                    nodeTypeComment = 8;
                var processText = function (htmlText) {
                    /* convert text to dom node 
                       DOMParster always returns full html doc */
                    var doc = new DOMParser().parseFromString(htmlText, "text/html");

                    /* process only body nodes */
                    var bodyNode = doc.getElementsByTagName("BODY")[0];

                    /* empty text node. match and remove these */
                    var emptyText = new RegExp(/^\n$/);

                    /* iterate over top level
                       processNode function is called recursively for each nodes children */
                    Array.from(bodyNode.childNodes).forEach(childNode => {
                        if (childNode.nodeType === nodeTypeText
                            && childNode.nodeValue.match(emptyText)) {
                            bodyNode.removeChild(childNode);
                        }
                        else {
                            processNode(childNode);
                        }
                    });
                    return bodyNode;
                };
                var processNode = function (node) {
                    var parentNode = node.parentNode;

                    switch (node.nodeType) {
                        case nodeTypeElement:
                            var nodeName = node.nodeName.toLowerCase();

                            /* remove whole elements */
                            if (options.onPaste.whiteList.allowedTags.indexOf(nodeName) === -1) {
                                /* element is not whitelisted
                                   but children might be.
                                   processes separately before removing this node */ 
                                node.childNodes.forEach(childNode => {
                                    processNode(childNode);
                                });
                                return void parentNode.removeChild(node);
                            }

                            /* element is whitelisted, however
                               some elements require attributes or they are 
                               broken and should be removed */
                            if (options.onPaste.whiteList.requiresAttributes.indexOf(nodeName) > -1
                                && node.attributes.length === 0) {
                                return void parentNode.removeChild(node);
                            }

                            /* if span whitelisted -
                               whitelisted span tags with no attibutes can be removed
                               (but keep child text) */
                            if (nodeName === "span" && node.attributes.length === 0) {
                                return void parentNode.replaceChild(node.firstChild, node);
                            }

                            /* now allow/remove whitelisted tags' attributes */
                            var allowedAttributes = options.onPaste.whiteList.allowedAttributes[nodeName] || [];
                            Array.from(node.attributes).forEach(attribute => {
                                if (allowedAttributes.indexOf(attribute.name.toLowerCase()) === -1) {
                                    /* attribute not allowed */
                                    node.removeAttribute(attribute.name);
                                }
                            });

                            /* process child nodes */
                            node.childNodes.forEach(childNode => {
                                processNode(childNode);
                            });
                            break;
                        case nodeTypeText:
                            if (parentNode.nodeName.toLowerCase() === "body") {
                                // text with no parent may have have new lines. split on these and wrap in p tags
                                var paragraphs = node.nodeValue.split(/\s{2,}/gm);
                                var trailingWhiteSpace = new RegExp(/[ \t]+$/g);
                                var tempTextValue = "";

                                paragraphs.reverse().forEach(element => {
                                    var newPara = document.createElement("p");
                                    var content = document.createTextNode(element.replace(trailingWhiteSpace, ""));
                                    newPara.appendChild(content);
                                    parentNode.appendChild(newPara);
                                });
                                parentNode.removeChild(node);
                            }
                            break;
                        case nodeTypeAttribute:
                        case nodeTypeComment:
                        default:
                            return void parentNode.removeChild(node);
                    }
                };
                this.events = {
                    'summernote.paste': function (we, e) {
                        e.preventDefault();
                        if (window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
                            /* ie */
                            var text = window.clipboardData.getData("Text");
                        } else {
                            text = e.originalEvent.clipboardData.getData('text/html');
                        }
                        try {
                            var processedNode = processText(text);
                        }
                        catch (error) {
                            $('.note-status-output').html(
                                '<div class="alert alert-danger">' + lang.onPaste.unknownError + '</div>'
                            );
                            console.log('summernote-ext-on-paste - unexpected error: ' + error);
                        }

                        if (processedNode && processedNode.hasChildNodes()) {
                            Array.from(processedNode.childNodes).forEach(childNode => {
                                setTimeout(function () {
                                    $note.summernote('insertNode', childNode);
                                }, 1);
                            });

                            $('.note-status-output').html(
                                '<div class="alert alert-success">' + lang.onPaste.success + '</div>'
                            );
                        }
                        else {
                            $('.note-status-output').html(
                                '<div class="alert alert-warning">' + lang.onPaste.allElementsRemoved + '</div>'
                            );
                        }

                        setTimeout(() => {
                            $editor.find('.summernote-cleanerAlert').remove();
                        }, 5);
                    }
                };
            }
        });
    }));
