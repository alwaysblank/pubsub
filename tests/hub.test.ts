import Hub from '../src/hub';
import Message from '../src/message';

test('Create a hub', () => {
	const hub = new Hub();
	expect(hub).toBeInstanceOf(Hub);
});

test('Subscribe and receive', () => {
	const hub = new Hub();
	const callback = jest.fn();
	hub.sub('test', callback);
	hub.pub('test', 'sandwich');
	expect(callback).toHaveBeenCalledTimes(1);
	expect(callback).toHaveBeenCalledWith('sandwich');
});

test('Subscribe and receive multiple', () => {
	const hub = new Hub();
	const callback = jest.fn();
	hub.sub('test', callback);
	hub.pub('test', 'sandwich');
	hub.pub('test', 'hamburger');
	hub.pub('test', 'salad');
	expect(callback).toHaveBeenCalledTimes(3);
	expect(callback).toHaveBeenCalledWith('sandwich');
	expect(callback).toHaveBeenCalledWith('hamburger');
	expect(callback).toHaveBeenCalledWith('salad');
	expect(hub.getMessages('test')).toHaveLength(3);
});

test('Subscribe and receive old', () => {
	const hub = new Hub();
	const callback = jest.fn();
	hub.pub('test', 'sandwich');
	const unsub1 = hub.sub('test', callback, 1);
	expect(callback).toHaveBeenCalledTimes(1);
	expect(callback).toHaveBeenCalledWith('sandwich');
	unsub1(); // Remote first sub.
	hub.pub('test', 'hamburger');
	hub.pub('test', 'salad');
	hub.pub('test', 'ice cream');
	expect(hub.getMessages('test')).toHaveLength(4);
	const callback2items = jest.fn();
	const callbackAllItems = jest.fn();
	const callbackNegativeItems = jest.fn();

	hub.sub('test', callback2items, 2);
	expect(callback2items).toHaveBeenCalledTimes(2);
	expect(callback2items).toHaveBeenCalledWith('ice cream');
	expect(callback2items).toHaveBeenCalledWith('salad');
	expect(callback2items).not.toHaveBeenCalledWith('hamburger');
	expect(callback2items).not.toHaveBeenCalledWith('sandwich');


	hub.sub('test', callbackAllItems, Infinity);
	expect(callbackAllItems).toHaveBeenCalledTimes(4);
	expect(callbackAllItems).toHaveBeenCalledWith('ice cream');
	expect(callbackAllItems).toHaveBeenCalledWith('salad');
	expect(callbackAllItems).toHaveBeenCalledWith('hamburger');
	expect(callbackAllItems).toHaveBeenCalledWith('sandwich');

	hub.sub('test', callbackNegativeItems, -2);
	expect(callbackNegativeItems).toHaveBeenCalledTimes(2);
	expect(callbackNegativeItems).toHaveBeenCalledWith('hamburger');
	expect(callbackNegativeItems).toHaveBeenCalledWith('sandwich');
	expect(callbackNegativeItems).not.toHaveBeenCalledWith('ice cream');
	expect(callbackNegativeItems).not.toHaveBeenCalledWith('salad');
});

test('Subscribe and don\'t receive old', () => {
	const hub = new Hub();
	const callback = jest.fn();
	hub.pub('test', 'sandwich');
	hub.sub('test', callback);
	expect(callback).toHaveBeenCalledTimes(0);
});

test('Subscribe and unsubscribe', () => {
	const hub = new Hub();
	const callback = jest.fn();
	const unsub = hub.sub('test', callback);
	hub.pub('test', 'sandwich');
	expect(callback).toHaveBeenCalledTimes(1);
	expect(callback).toHaveBeenCalledWith('sandwich');
	expect(hub.getMessages('test')).toHaveLength(1)
	unsub();
	hub.pub('test', 'hamburger');
	expect(callback).toHaveBeenCalledTimes(1);
	expect(callback).toHaveBeenCalledWith('sandwich');
	expect(hub.getMessages('test')).toHaveLength(2);
});

test('Subscribe and receive nothing from non-hub events', () => {
	const hub = new Hub();
	const callback = jest.fn();
	hub.sub('test', callback)
	hub.dispatchEvent(new Event('test'));
	expect(callback).toHaveBeenCalledTimes(0);
	hub.pub('sausage', 'sandwich');
	expect(callback).toHaveBeenCalledTimes(0);
	const evt = new Event(Message.NAME);
	hub.dispatchEvent(evt);
	expect(callback).toHaveBeenCalledTimes(0);
})

test('Watch another event dispatcher', () => {
	const emitter = new EventTarget();
	const hub = new Hub();
	const callback = jest.fn();
	const unwatch = hub.watch('emitter', emitter, 'test', e => e.type);
	hub.sub('emitter', callback);
	emitter.dispatchEvent(new Event('test'));
	expect(callback).toHaveBeenCalledTimes(1);
	expect(callback).toHaveBeenCalledWith('test');
	expect(hub.getMessages('emitter')).toHaveLength(1);
	unwatch();
	emitter.dispatchEvent(new Event('test'));
	expect(callback).toHaveBeenCalledTimes(1);
	expect(hub.getMessages('emitter')).toHaveLength(1);
});

test('Get past messages', () => {
	const hub = new Hub();
	hub.pub('test', 'sandwich');
	hub.pub('test', 'hamburger');
	hub.pub('test', 'salad');
	expect(hub.getMessages('test')).toHaveLength(3); // Default is to return all.
	expect(hub.getMessages('test', Infinity)).toHaveLength(3);
	expect(hub.getMessages('test', -Infinity)).toHaveLength(3);
	expect(hub.getMessages('test', 1)).toHaveLength(1);
	expect(hub.getMessages('test', -1)).toHaveLength(1);
	expect(hub.getMessages('test', 2)).toHaveLength(2);
	expect(hub.getMessages('test', 1)[0].payload).toBe('salad'); // Should return last item.
	expect(hub.getMessages('test', -1)[0].payload).toBe('sandwich'); // Should return first item.
	expect(hub.getMessages('does not exist', 10)).toStrictEqual([]);
})
