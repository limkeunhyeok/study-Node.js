function decorate(component) {
    const proto = Object.getPrototypeOf(component);

    function Decorator(component) {
        this.component = component;
    }
    Decorator.prototype = Object.create(proto);

    // 새 메소드
    Decorator.prototype.greetings = function() {
        return 'Hi!';
    };

    // 위임된 메소드
    Decorator.prototype.hello = function() {
        return this.component.hello.apply(this.component, arguments);
    };

    return new Decorator(component);
}