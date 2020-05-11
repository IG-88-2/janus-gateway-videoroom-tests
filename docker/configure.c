#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <libconfig.h>
#include <argp.h>

struct parameter {
	const char *group;
	const char *name;
	int type;
};

static struct argp_option options[] = {
	{ "admin_key", 'q', OPTION_ARG_OPTIONAL, 0 },
	{ "string_ids", 'w', OPTION_ARG_OPTIONAL, 0 },
	{ "rtp_port_range", 'e', OPTION_ARG_OPTIONAL, 0 },
	{ "server_name", 'r', OPTION_ARG_OPTIONAL, 0 },
	{ "admin_secret", 't', OPTION_ARG_OPTIONAL, 0 },
	{ "api_secret", 'y', OPTION_ARG_OPTIONAL, 0 },
	{ "token_auth", 'u', OPTION_ARG_OPTIONAL, 0 },
	{ "token_auth_secret", 'i', OPTION_ARG_OPTIONAL, 0 },
	{ "session_timeout", 'o', OPTION_ARG_OPTIONAL, 0 },
	{ "candidates_timeout", 'p', OPTION_ARG_OPTIONAL, 0 },
	{ "reclaim_session_timeout", 'a', OPTION_ARG_OPTIONAL, 0 },
	{ "debug_level", 's', OPTION_ARG_OPTIONAL, 0 },
	{ "log_to_stdout", 'd', OPTION_ARG_OPTIONAL, 0 },
	{ "log_prefix", 'f', OPTION_ARG_OPTIONAL, 0 },
	{ "interface", 'g', OPTION_ARG_OPTIONAL, 0 },
	{ "stun_server", 'h', OPTION_ARG_OPTIONAL, 0 },
	{ "stun_port", 'j', OPTION_ARG_OPTIONAL, 0 },
	{ "nice_debug", 'k', OPTION_ARG_OPTIONAL, 0 },
	{ "full_trickle", 'l', OPTION_ARG_OPTIONAL, 0 },
	{ "nat_1_1_mapping", 'z', OPTION_ARG_OPTIONAL, 0 },
  	{ 0 }
};

struct arguments {
	char *admin_key;
	char *rtp_port_range;
	char *server_name;
	char *admin_secret;
	char *api_secret;
	char *token_auth_secret;
	char *log_prefix;
	char *interface;
	char *stun_server;
	char *nat_1_1_mapping;
	int token_auth;
	int session_timeout;
	int candidates_timeout;
	int reclaim_session_timeout;
	int debug_level;
	int log_to_stdout;
	int string_ids;
	int stun_port;
	int nice_debug;
	int full_trickle;
};



static error_t parse_opt (int key, char *arg, struct argp_state *state) {
	struct arguments *arguments = state->input;

	switch (key) {
		case 'q': 
			arguments->admin_key = arg;
			break;
	    case 'w': 
			arguments->string_ids = 1;
			break;
	    case 'e':
			arguments->rtp_port_range = arg;
			break;
	    case 'r': 
			arguments->server_name = arg;
			break;
	    case 't':
			arguments->admin_secret = arg;
			break;
		case 'y': 
			arguments->api_secret = arg;
			break;
		case 'u': 
			arguments->token_auth = 1;
			break;
		case 'i': 
			arguments->token_auth_secret = arg;
			break;
		case 'o': 
			arguments->session_timeout = (int)arg;
			break;
		case 'p': 
			arguments->candidates_timeout = (int)arg;
			break;
		case 'a':
			arguments->reclaim_session_timeout = (int)arg;
			break;
		case 's': 
			arguments->debug_level = (int)arg;
			break;
		case 'd':
			arguments->log_to_stdout = 1;
			break;
		case 'f': 
			arguments->log_prefix = arg;
			break;
		case 'g': 
			arguments->interface = arg;
			break;
		case 'h': 
			arguments->stun_server = arg;
			break;
		case 'j': 
			arguments->stun_port = (int)arg;
			break;
		case 'k':
			arguments->nice_debug = 1;
			break;
		case 'l': 
			arguments->full_trickle = 1;
			break;
		case 'z': 
			arguments->nat_1_1_mapping = arg;
			break;
		default:
			return ARGP_ERR_UNKNOWN;
	}
	return 0;
};



static struct argp argp = { 
	options, 
	parse_opt, 
	0, 
	0 
};



int main(int argc, char **argv) {
	static const char *janus_config_path = "./tests/config/janus.jcfg";
	static const char *janus_videoroom_config_path = "./tests/config/janus.plugin.videoroom.jcfg";
  	struct arguments arguments = { 
		.admin_key = NULL,
		.rtp_port_range = NULL,
		.server_name = NULL,
		.admin_secret = NULL,
		.api_secret = NULL,
		.token_auth_secret = NULL,
		.log_prefix = NULL,
		.interface = NULL,
		.stun_server = NULL,
		.nat_1_1_mapping = NULL,
		.token_auth = 0, 
		.session_timeout = 0,
		.candidates_timeout = 0,
		.reclaim_session_timeout = 0,
		.debug_level = 0,
		.log_to_stdout = 0,
		.string_ids = 0,
		.stun_port = 0,
		.nice_debug = 0,
		.full_trickle = 0
	};
	config_t janus_videoroom_config;
	config_t janus_config;
	argp_parse (&argp, argc, argv, 0, 0, &arguments);
	config_init(&janus_videoroom_config);
	config_init(&janus_config);
  	config_setting_t *root, *setting;
	//config_set_options(&janus_videoroom_config, (CONFIG_OPTION_ALLOW_OVERRIDES));
	//config_set_options(&janus_config, (CONFIG_OPTION_ALLOW_OVERRIDES));

	if (!config_read_file(&janus_config, janus_config_path)) {
		fprintf(
			stderr, 
			"%s:%d - %s\n", 
			config_error_file(&janus_config), 
			config_error_line(&janus_config), 
			config_error_text(&janus_config)
		);
		config_destroy(&janus_config);
		config_destroy(&janus_videoroom_config);
		return EXIT_FAILURE;
	}

	if (!config_read_file(&janus_videoroom_config, janus_videoroom_config_path)) {
		fprintf(
			stderr, 
			"%s:%d - %s\n",
			config_error_file(&janus_videoroom_config), 
			config_error_line(&janus_videoroom_config),
			config_error_text(&janus_videoroom_config)
		);
		config_destroy(&janus_config);
		config_destroy(&janus_videoroom_config);
		return EXIT_FAILURE;
	}
	
	if (arguments.admin_key) {
		root = config_root_setting(&janus_videoroom_config);
		setting = config_setting_get_member(root, "general");
		if (!setting) {
			setting = config_setting_add(root, "general", CONFIG_TYPE_GROUP);
		}
		config_setting_remove(setting, "admin_key");
		setting = config_setting_add(setting, "admin_key", CONFIG_TYPE_STRING);
  		config_setting_set_string(setting, arguments.admin_key);
	}

	if (arguments.string_ids) {
		root = config_root_setting(&janus_videoroom_config);
		setting = config_setting_get_member(root, "general");
		if (!setting) {
			setting = config_setting_add(root, "general", CONFIG_TYPE_GROUP);
		}
		config_setting_remove(setting, "string_ids");
		setting = config_setting_add(setting, "string_ids", CONFIG_TYPE_BOOL);
		config_setting_set_bool(setting, arguments.string_ids);
	}
	
	if (arguments.server_name) {
		root = config_root_setting(&janus_config);
		setting = config_setting_get_member(root, "general");
		if (!setting) {
			setting = config_setting_add(root, "general", CONFIG_TYPE_GROUP);
		}
		config_setting_remove(setting, "server_name");
		setting = config_setting_add(setting, "server_name", CONFIG_TYPE_STRING);
		config_setting_set_string(setting, arguments.server_name);
	}

	if (arguments.admin_secret) {
		root = config_root_setting(&janus_config);
		setting = config_setting_get_member(root, "general");
		if (!setting) {
			setting = config_setting_add(root, "general", CONFIG_TYPE_GROUP);
		}
		config_setting_remove(setting, "admin_secret");
		setting = config_setting_add(setting, "admin_secret", CONFIG_TYPE_STRING);
		config_setting_set_string(setting, arguments.admin_secret);
	}
	
 	if (
		!config_write_file(&janus_config, janus_config_path) ||
		!config_write_file(&janus_videoroom_config, janus_videoroom_config_path)
	) {
		fprintf(stderr, "Error while writing file.\n");
		config_destroy(&janus_config);
		config_destroy(&janus_videoroom_config);
		return EXIT_FAILURE;
	}

	fprintf(stderr, "Configuration successfully updated");
	config_destroy(&janus_videoroom_config);
	config_destroy(&janus_config);
	return EXIT_SUCCESS;
}
