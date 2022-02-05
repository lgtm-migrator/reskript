import {Plugin} from 'vite';

const isStyle = (id: string) => /\.module\.(css|less|sass|scss|styl|stylus|pcss|postcss)(\?used)?$/.test(id);

const ASSIGN_MODULE_ID = 'virtual:reskript-css-bind/css-bind/assign';

const ASSIGN_MODULE = `
    var hasOwn = Object.prototype.hasOwnProperty;

    export default function assignLocals(locals, css) {
        for (var style in locals) {
            if (hasOwn.call(locals, style)) {
                try {
                    Object.defineProperty(css, style, {value: locals[style]});
                }
                catch (ex) {
                    console.warn(
                        'Unable to assign class name "' + style + '" to function, '
                        + 'change your class name or avoid use .' + style + ' from exported object of stylesheets. '
                        + 'See https://github.com/ecomfe/class-names-loader/wiki/Unsafe-class-names for detail.'
                    );
                }
            }
        }
    }
`;

// TODO: 单元测试
const transformCssModulesExport = (code: string, classNamesModule: string) => {
    const indexOfExportStatement = code.lastIndexOf('export default');
    const indexOfStartBrace = code.indexOf('{', indexOfExportStatement);
    const indexOfEndBrace = code.lastIndexOf('}');
    return `
        // generated by css-bind plugin
        import __classNames__ from '${classNamesModule}';
        import __assign__ from '${ASSIGN_MODULE_ID}';

        ${code.slice(0, indexOfExportStatement)}
        const __css_object__ = ${code.slice(indexOfStartBrace, indexOfEndBrace + 1)};
        const __css_function__ = __classNames__.bind(__css_object__);
        __assign__(__css_object__, __css_function__);
        export default __css_function__;
        ${code.slice(indexOfEndBrace + 1)};
    `;
};

interface Options {
    classNamesModule?: string;
}

export default function cssBindPlugin({classNamesModule = 'classnames/bind'}: Options = {}): Plugin {
    return {
        name: 'reskript:css-bind',
        enforce: 'post',
        resolveId(id) {
            if (id === ASSIGN_MODULE_ID) {
                return id;
            }
        },
        transform(code, id) {
            if (isStyle(id)) {
                return transformCssModulesExport(code, classNamesModule);
            }
        },
        load(id) {
            if (id === ASSIGN_MODULE_ID) {
                return ASSIGN_MODULE;
            }
        },
    };
}
