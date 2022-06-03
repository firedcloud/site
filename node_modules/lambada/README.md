# Lambada — create simple functions easily in JavaScript

> A lambda função vai estar com ele aonde for.

Lambada is a small library for creating simple functions easily in Javascript.
It borrows the **string lambda** concept (and source code) from the
[Functional Javascript](https://github.com/osteele/functional-javascript)
library:

    $ node
    > λ = require('lambada');

    > f = λ('*10')
    > f(7)
    70

    > f = λ('10 * a + b')
    > f(4, 1)
    41

    > f = λ('x, y -> y + "!"')
    > f('hello', 'world')
    'world!'

Together with JavaScript's built-in high-order functions,
lambada allows you to write terse, functional code:

    > [6, 1, 4, 7, 5, 2, 4].filter(λ('>4')).map(λ('*11'))
    [ 66, 77, 55 ]

Lambada also provides some practical utility functions
for creating and combining other functions for common use cases.
For example, function composition:

    // Random numbers between 0 and 5 with one decimal digit
    > random = λ.compose('/10', Math.floor, '*50', Math.random)
    > random()
    3.5
    > random()
    0.2
    > random()
    3.3
    > random()
    2.6

Read the [tests](test.js) to see more examples.

Lambada implements [UMD](https://github.com/umdjs/umd)
so it should play well (*crosses fingers*)
with RequireJS, Node and Browserify.

With lambada, you'll stop dancing like this:

    \o     o/   \o\
     |\   /|     |
    /\    < \   /\

and you'll begin dancing like this:

![Lambada](http://31.media.tumblr.com/4c9669b5138ff14cffa81d0b0f0e0e4e/tumblr_mijb4m6nkZ1rqbnt0o1_500.gif)


## Instructions for development

    $ git clone https://github.com/rbonvall/lambada
    $ cd lambada

    $ npm install    # Install development dependencies
    $ gulp lint      # Lint code
    $ gulp test      # Run tests
    $ gulp uglify    # Minify

## License

[MIT license](LICENSE.md).
