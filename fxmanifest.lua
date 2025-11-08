
fx_version 'cerulean'
game 'common'
lua54 'yes'
node_version '22'

name 'kjmysql'
author 'kjmysql'
version '1.0.0'
description 'A FiveM MySQL resource using node-mysql2'

server_script 'dist/build.js'

client_script 'ui.lua'

files {
    'web/build/index.html',
    'web/build/**/*'
}

ui_page 'web/build/index.html'

provide 'mysql-async'
provide 'ghmattimysql'

convar_category 'kjmysql' {
	'Configuration',
	{
		{ 'Connection string', 'mysql_connection_string', 'CV_STRING', 'mysql://user:password@localhost/database' },
		{ 'Debug', 'mysql_debug', 'CV_BOOL', 'false' },
    { 'Slow Query Warning (ms)', 'mysql_slow_query_warning', 'CV_INT', '200' },
    { 'Result Set Warning (rows)', 'mysql_resultset_warning', 'CV_INT', '1000' },
    { 'Check for Updates', 'mysql_versioncheck', 'CV_BOOL', 'true' }
	}
}
