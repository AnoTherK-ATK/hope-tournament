import os
import re
import glob

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
    if not os.path.exists(jsx_path) or not os.path.exists(css_path):
        return

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

    # Check if cx is already present
    if "const cx =" not in content:
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
    print(f"Migrated {jsx_path}")

def main():
    base_dir = '/home/anotherk/tournament/client/src'
    for directory in ['pages', 'components']:
        dir_path = os.path.join(base_dir, directory)
        for jsx_file in glob.glob(os.path.join(dir_path, '*.jsx')):
            css_file = jsx_file.replace('.jsx', '.css')
            if os.path.exists(css_file):
                migrate_file(jsx_file, css_file)

if __name__ == '__main__':
    main()
