import os
import re

CX_HELPER = """
const cx = (...classes) => {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
    .split(' ')
    .filter(Boolean)
    .map(c => styles[c] || c)
    .join(' ');
};
"""

def migrate_file(jsx_path, css_path):
    with open(jsx_path, 'r') as f:
        content = f.read()
    
    # Update import
    css_filename = os.path.basename(css_path)
    module_css_filename = css_filename.replace('.css', '.module.css')
    
    if f"import './{css_filename}'" in content:
        content = content.replace(f"import './{css_filename}'", f"import styles from './{module_css_filename}'")
    elif f"import \"./{css_filename}\"" in content:
        content = content.replace(f"import \"./{css_filename}\"", f"import styles from './{module_css_filename}'")
    else:
        print(f"Could not find import for {css_filename} in {jsx_path}")
        return

    # Insert cx helper right after imports
    import_end = content.rfind('import ')
    if import_end != -1:
        newline_after_import = content.find('\n', import_end)
        content = content[:newline_after_import+1] + CX_HELPER + content[newline_after_import+1:]
    else:
        content = CX_HELPER + content

    # Replace className="string"
    content = re.sub(r'className="([^"]+)"', r'className={cx("\1")}', content)
    
    # Replace className={`string`}
    content = re.sub(r'className=\{`([^`]+)`\}', r'className={cx(`\1`)}', content)
    
    # Replace className={expr} (excluding the ones we just added with cx)
    # This regex looks for className={...} where the inside doesn't start with cx(
    def replace_expr(match):
        expr = match.group(1)
        if expr.startswith('cx('):
            return match.group(0)
        return f'className={{cx({expr})}}'
    
    content = re.sub(r'className=\{([^}]+)\}', replace_expr, content)

    with open(jsx_path, 'w') as f:
        f.write(content)
        
    # Rename CSS file
    os.rename(css_path, css_path.replace('.css', '.module.css'))

# Run for BracketOverlay as a test
migrate_file('/home/anotherk/tournament/client/src/pages/BracketOverlay.jsx', '/home/anotherk/tournament/client/src/pages/BracketOverlay.css')

