# summernote-ext-on-paste
A plugin for the [Summernote](https://github.com/summernote/summernote/) WYSIWYG editor.

summernote-ext-on-paste was originally forked from [Diemen Design](https://github.com/DiemenDesign/summernote-cleaner), which is an html cleaner plugin for summernote.

Originally the fork was going to be used for hunting down and fixing issues I had using the plugin, but that plugin pretty much exclusively uses regular expressions to do the html parsing/cleaning.

Using regex's for that kind work is beyond me, so I re-wrote the core to just iterate over the DOM, using properties and conditionals to remove unwanted cruft. One thing led to another, and I ended up creating quite a different plugin. 

This plugin only has one mode - it's always on and automatically acts on paste. It also is configurable in different ways, described below. I also removed some of the features of the other plugin, notably initiating the clean with a toolbar button, limiting the amount of text to be pasted, and replacing the summernote 'empty' node with something configurable. I also ran into the pasteHTML and insertNode issues ([#3933](https://github.com/summernote/summernote/issues/3393), [#3370](https://github.com/summernote/summernote/issues/3370)) so I added some cleanup code to address that.

I've also dropped special IE support and I'm using ES6.

I also added a new feature, which is to wrap non-empty text nodes in a p tag. Depending on where you are copying content from, the paragraphs will simply be separated by newlines. These will be transformed into paragraphs if they are not within an element.

See a [working example](http://htmlpreview.github.io/?https://github.com/malloryCode/summernote-ext-on-paste/blob/master/example/index.html).

### Installation

#### 1. Include JS

Include the following code after Summernote:

```html
<script src="summernote-ext-on-paste.js"></script>
```

#### 2. Supported languages

English, Spanish, French

#### 3. OnPaste options

**Note:** for each option given in the summernote intitialization, the option is _not_ merged with the default - your option will replace the default, so copy the default from here or the source for a given option, then modify it. Also, I am basically matching strings, so custom elements/attributes can be included.

**allowedTags** - an array of allowed elements. By default, all HTML elements will be removed on paste, unless they are whitelisted here.

Default: 

```javascript
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
]
```

To override, initialize summernote:

```javascript
$('.summernote').summernote({
    onPaste: {
        allowedTags: [
            "h1",
            "div"
        ]
    }
});
```

**allowChildren** - array - for elements listed here, children in the allow list will be moved up the DOM tree and processed separately. i.e. if 'aside' is not allowed, you can keep the elements within the aside tag by adding 'aside' to this array. So the disallowed tag will be removed, but the children might be, if they are in the allowed list, or are text nodes.

Default: 
```javascript
allowChildren: []
```
To override, initialize summernote:

```javascript
$('.summernote').summernote({
    onPaste: {
        allowChildren: [
            "aside",
            "div"
        ]
    }
});
```

**trimText** - boolean - if true, text nodes will be trimmed of white space and newlines.

Default: 
```javascript
trimText: true
```
To override, initialize summernote:

```javascript
$('.summernote').summernote({
    onPaste: {
        trimText: false
    }
});
```

**requiresAttributes** - array - elements in this list will be removed if there are no attributes. For example, ```html <a>some text</a>``` would be removed.

Default: 
```javascript
requiresAttributes: [
    "img",
    "a"
]
```

To override, initialize summernote:

```javascript
$('.summernote').summernote({
    onPaste: {
        requiresAttributes: [
            "iframe"
        ]
    }
});
```

**allowedAttributes** - json object listing elements and an array of their allowed attributes. For most elements being pasted in you will want the attributes to be stripped. But here you can whitelist attributes on a per element basis, allowing anchor tags and preserving their href value, for example. If an element is not in the allowedTags option, then it will be ignored in this list.

Default:
```javascript
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
```

To override, initialize summernote:

```javascript
$('.summernote').summernote({
    onPaste: {
        allowedAttributes: {
            img: [
                "src",
                "height",
                "width",
                "style"
            ],
            a: [
                "href",
                "name",
                "download"
            ],
        }
    }
});
```
#### 4. Thanks
- [Diemen Design](https://github.com/DiemenDesign/)
  - I used his plugins to get started