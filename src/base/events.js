// Events
// ---------------

import Promise from './promise';
import events from 'events'
import _, { each, flatten, flow, map, words } from 'lodash';

const { EventEmitter } = events;

const flatMap = flow(map, flatten);

/**
 * @class Events
 * @description
 * Base Event class inherited by {@link Model} and {@link Collection}. It's not
 * meant to be used directly, and is only displayed here for completeness.
 */
export default class Events extends EventEmitter {

  /**
   * @method Events#on
   * @description
   * Register an event listener. The callback will be invoked whenever the event
   * is fired. The event string may also be a space-delimited list of several
   * event names.
   *
   * @param {string} eventName
   *   The name of the event or space separated list of events to register a
   *   callback for.
   * @param {function} callback
   *   That callback to invoke whenever the event is fired.
   */
  on(nameOrNames, handler, ...args) {
    for (const name of words(nameOrNames)) {
      EventEmitter.prototype.on.apply(this, [name, handler, ...args]);
    }
    return this;
  }

  /**
   * @method Events#off
   * @description
   * Remove a previously-bound callback event listener from an object. If no
   * event name is specified, callbacks for all events will be removed.
   *
   * @param {string} eventName
   *   The name of the event or space separated list of events to stop listening
   *   to.
   */
  off(nameOrNames, listener) {
    if (nameOrNames == null) {
      return listener == null
        ? this.removeAllListeners()
        : this.removeAllListeners(listener);
    }

    each(words(nameOrNames), listener == null
      ? name => this.removeAllListeners(name)
      : name => this.removeAllListeners(name, listener)
    );

    return this;
  }

  /**
   * @method Events#trigger
   * @description
   * Trigger callbacks for the given event, or space-delimited list of events.
   * Subsequent arguments to `trigger` will be passed along to the event
   * callback.
   *
   * @param {string} eventName
   *   The name of the event to trigger. Also accepts a space separated list of
   *   event names.
   * @param {mixed} [arguments]
   *   Extra arguments to pass to the event listener callback function.
   */
  trigger(nameOrNames, ...args) {
    for (const name of nameOrNames) {
      EventEmitter.prototype.emit.apply(this, [name, ...args]);
    }
    return this;
  }

  /**
   * @method Events#triggerThen
   * @description
   * A promise version of {@link Events#trigger}, returning a promise which
   * resolves with all return values from triggered event handlers. If any of the
   * event handlers throw an `Error` or return a rejected promise, the promise
   * will be rejected. Used internally on the {@link Model#creating "creating"},
   * {@link Model#updating "updating"}, {@link Model#saving "saving"}, and {@link
   * Model@destroying "destroying"} events, and can be helpful when needing async
   * event handlers (for validations, etc).
   *
   * @param {string} name
   *   The event name, or a whitespace-separated list of event names, to be
   *   triggered.
   * @param {...mixed} args
   *   Arguments to be passed to any registered event handlers.
   * @returns Promise<mixed[]>
   *   A promise resolving the the resolved return values of any triggered handlers.
   */
  triggerThen(nameOrNames, ...args) {
    const names = words(nameOrNames);
    const listeners = flatMap(names, this.listeners, this);
    return Promise.map(listeners, listener =>
      listener.apply(this, args)
    );
  }

  /**
   * @method Events#once
   * @description
   * Just like {@link Events#on}, but causes the bound callback to fire only
   * once before being removed. Handy for saying "the next time that X happens,
   * do this". When multiple events are passed in using the space separated
   * syntax, the event will fire once for every event you passed in, not once
   * for a combination of all events.
   *
   * @param {string} eventName
   *   The name of the event or space separated list of events to register a
   *   callback for.
   * @param {function} callback
   *   That callback to invoke only once when the event is fired.
   */
  once(name, callback, context) {
    const once = _.once(() => {
      this.off(name, once);
      return callback.apply(this, arguments);
    });
    once._callback = callback;
    return this.on(name, once, context);
  }
}

export default Events;
