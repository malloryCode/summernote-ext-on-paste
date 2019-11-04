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
                    success: 'Pasted text has been processed&#33;',
                    allElementsRemoved: 'Pasted text contains only disallowed elements! Nothing pasted.',
                    unknownError: 'Unexpected error. Error message logged to the console.'
                }
            },
            'es-ES': {
                onPaste: {
                    success: '&#161;El texto pegado ha sido procesado!',
                    allElementsRemoved: '&#161;El texto pegado contiene solo elementos no permitidos&#33; Nada pegado.',
                    unknownError: 'Error inesperado. Mensaje de error registrado en la consola.'
                }
            },
            'fr-FR': {
                onPaste: {
                    success: 'Le texte colle&#769; a e&#769;te&#769; traite&#769;&#33;',
                    allElementsRemoved: 'Le texte colle&#769; ne contient que des e&#769;le&#769;ments interdits&#33; Rien colle&#769;.',
                    unknownError: 'Erreur inattendue. Message d&#39;erreur connecte&#769; a&#768; la console.'
                }
            }
        });
        $.extend($.summernote.options, {
            onPaste: {
                /* list of allowed html elements
                 * everything else will be removed - however,
                 * optionally children of removed elements will
                 * be processed and potentially included, separately.
                 * to get optional behavior set allowChildren to true */
                allowedTags: [
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
                /* if true, children of elements not in the allow list will
                 * be moved up the DOM and processed separately. i.e. if
                 * <aside> is not allowed, you can keep the actual code
                 * within the aside tag by adding 'aside' to this array.
                 */
                allowChildren: [],
                /* when processing text nodes, remove extaneous white
                 * space and new lines
                 */
                trimText:
                    true,
                /* some elements, such as 'img' and 'a', have no impact
                 * if they don't have attributes. include in this array 
                 * any elements that should be removed if they do not have
                 * attributes */
                requiresAttributes: [
                    "img",
                    "a"
                ],
                /* by default, all element attributes will be removed. by
                 * adding the element, and list of allowed attributes, to this
                 * option, you can whitelist those attributes */
                allowedAttributes: {
                    img: [
                        "src",
                        "alt",
                        "height",
                        "width"
                    ],
                    a: [
                        "href",
                        "target",
                        "name"
                    ],
                    table: [
                        "class"
                    ],
                    th: [
                        "colspan",
                        "rowspan"
                    ],
                    td: [
                        "colspan",
                        "rowspan"
                    ],
                    span: [
                        "class"
                    ]
                }
            }
        });
        $.extend($.summernote.plugins, {
            'onPaste': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    lang = context.options.langInfo,
                    onPasteOptions = $.extend({}, true, $.summernote.options.onPaste, context.options.onPaste),
                    nodeTypeElement = 1,
                    nodeTypeAttribute = 2,
                    nodeTypeText = 3,
                    nodeTypeComment = 8,
                    emptyText = new RegExp(/\A(\n|\s)*\z/gm),
                    trimStart = new RegExp(/^\n[ \t]+/gm),
                    trimEnd = new RegExp(/\n[ \t]+$/gm);
                var processText = function (htmlText) {
                    /* convert text to dom node 
                       DOMParster always returns full html doc */
                    var doc = new DOMParser().parseFromString(htmlText, "text/html");

                    /* process only body nodes */
                    var bodyNode = doc.getElementsByTagName("BODY")[0];

                    /* iterate over top level
                       processNode function is called recursively for each nodes children */
                    Array.from(bodyNode.childNodes).forEach(childNode => {
                        /* match and remove empty text nodes */
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
                            if (onPasteOptions.allowedTags.indexOf(nodeName) === -1) {
                            /* element is not whitelisted but children might be.
                               processes separately before removing this node */
                                if (onPasteOptions.allowChildren.indexOf(nodeName) !== -1) {
                                    node.childNodes.forEach(childNode => {
                                        /* if text node, wrap in p */
                                        if (childNode.nodeType === nodeTypeText) {
                                            var newPara = document.createElement("p");
                                            var content = document.createTextNode(childNode.nodeValue);
                                            newPara.appendChild(content);
                                            parentNode.insertBefore(newPara, node);
                                        }
                                        else {
                                            parentNode.insertBefore(childNode, node);
                                        }
                                    });
                                }
                                return void parentNode.removeChild(node);
                            }

                            /* element is whitelisted, however
                               some elements require attributes or they are 
                               broken and should be removed */
                            if (onPasteOptions.requiresAttributes.indexOf(nodeName) > -1
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
                            var allowedAttributes = onPasteOptions.allowedAttributes[nodeName] || [];
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
                            /* TODO: detect lists: i.e. lines start with '•' */
                            if (parentNode.nodeName.toLowerCase() === "body") {
                                if (node.nodeValue.match(emptyText)) {
                                    return void parentNode.removeChild(node);
                                }
                                /* text with no parent may have have new lines. 
                                 * split on these and wrap in p tags */
                                var paragraphs = node.nodeValue.split(/\s{2,}/gm);
                                var trailingWhiteSpace = new RegExp(/[ \t]+$/g);
                                var tempTextValue = "";

                                paragraphs.forEach(element => {
                                    /* skip empty lines */
                                    if (element.length > 0) {
                                        var newPara = document.createElement("p");
                                        var content = document.createTextNode(element.replace(trailingWhiteSpace, ""));
                                        newPara.appendChild(content);
                                        parentNode.appendChild(newPara);
                                    }
                                });
                                /* new paragraph inserted, now remove
                                 * plain text node */
                                parentNode.removeChild(node);
                            }
                            else if (onPasteOptions.trimText) {
                                node.nodeValue = node.nodeValue.replace(trimStart, "");
                                node.nodeValue = node.nodeValue.replace(trimEnd, "");
                            }
                            break;
                        case nodeTypeAttribute:
                        case nodeTypeComment:
                        default:
                            return void parentNode.removeChild(node);
                    }
                };
                var removeEmptyNodes = function (text) {
                    /* summernote inserts empty elements when
                     * pasting html or inserting nodes (v 8.12).
                     * with 5 nodes being pasted, 5 empty elements
                     * (matching the type being pasted), get 
                     * appended to the end of the code. this
                     * function removes nodes that consist of 
                     * the tag and <br>. as doing this cleanup
                     * cannot be done with an event (because
                     * recursion), here it is called from a
                     * timeout after our paste operation is
                     * done. */
                    var fragment = document.createElement('div');
                    fragment.innerHTML = text;
                    var anyHits = 0;
                    Array.from(fragment.childNodes).forEach(childNode => {
                        /* match and remove empty text nodes */
                        if (childNode.childNodes.length === 1
                            && childNode.firstChild.nodeType === nodeTypeElement
                            && childNode.firstChild.nodeName === "BR") {
                            anyHits++;
                            fragment.removeChild(childNode);
                        }
                    });
                    if (anyHits > 0) {
                        $note.summernote('code', fragment.innerHTML);
                    }
                };
                this.events = {
                    'summernote.paste': function (we, e) {
                        e.preventDefault();
                        var text = e.originalEvent.clipboardData.getData('text');
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
                                $note.summernote('pasteHTML', childNode.outerHTML);
                            });

                            window.setTimeout(function () {
                                removeEmptyNodes($note.summernote('code'));
                            }, 350);

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
                            $('.note-status-output').html('');
                        }, 3000);
                    }
                };
            }
        });
    }));
