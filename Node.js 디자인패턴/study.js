asyncFoo(err => {
    asyncBar(err => {
        asyncFooBar(err => {
            // ...
        });
    });
});

