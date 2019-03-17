import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { makeCacheBusterDecorator } from './common';
import { ICacheBusterConfig } from './common/ICacheBusterConfig';

export const CacheBuster = makeCacheBusterDecorator<Observable<any>>(
  (propertyDescriptor, oldMethod, cacheBusterConfig: ICacheBusterConfig) => {
    /* use function instead of an arrow function to keep context of invocation */
    (propertyDescriptor.value as any) = function(...parameters) {
      return (oldMethod.call(this, ...parameters) as Observable<any>).pipe(
        tap(() => {
          if (cacheBusterConfig.cacheBusterNotifier) {
            cacheBusterConfig.cacheBusterNotifier.next();
          }
        })
      );
    };
  }
);
