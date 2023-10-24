# hit a hint

hit a hint for preview mode.


```md
* http://yahoo.co.jp
* http://google.com
* [twitter](http://twitter.com)
* [Inkdrop](inkdrop://note:ABCDEFGHI)
```

![Screenshot](https://raw.githubusercontent.com/basyura/inkdrop-hitahint/master/images/preview.png)

## Install

```
ipm install hitahint
```

## Commands

| Command       | Explanation |
| ------------- | ----------- |
| hitahint:show | show hint   |

## Settings

```json
hintcharacters: {
  title: "hintcharacters",
  type: "string",
  default: "asdfghl",
},
```

## CHANGELOG

0.7.0 - 2023/10/24

* add element's null check

0.4.0 - 2021/05/29

* fix note link and inner link

0.3.0 - 2020/09/23

* add dblclick-expansion-image:open support

0.2.0 - 2020/07/27

* add toc support

0.1.0 - 2020/07/19

* first release.
