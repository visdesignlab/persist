from IPython import get_ipython
from IPython.core.magic import Magics, magics_class, cell_magic, needs_local_scope
from IPython.core.magic_arguments import magic_arguments, argument, parse_argstring
from altair import TopLevelSpec
from pandas import DataFrame

from persist_ext.internals.widgets.persist_output.widget import PersistWidget


@magics_class
class PersistMagic(Magics):
    @staticmethod
    def initialize():
        get_ipython().register_magics(PersistMagic)

    def __init__(self, shell):
        super(PersistMagic, self).__init__(shell)
        self.call_counter = 0

    @cell_magic
    @magic_arguments()
    @needs_local_scope
    @argument(
        "--df_name",
        dest="df_name",
        help="Enter name to use for dynamic dataframe",
        default="persist_df",
    )
    def persist_cell(self, line, cell, local_ns):
        args = parse_argstring(self.persist_cell, line)

        execution_result = get_ipython().run_cell(cell)
        result = execution_result.result

        if not isinstance(result, DataFrame) and not isinstance(result, TopLevelSpec):
            return result

        # dataframe_name_ids = dict()
        #
        # tree = ast.parse(cell)
        #
        # # Walk throught the AST and assign uids to all dataframe variables
        # # Store the mappings in a dict
        # for node in ast.walk(tree):
        #     if isinstance(node, ast.Name):
        #         var_name = node.id
        #         var_value = local_ns[var_name]
        #
        #         if isinstance(var_value, DataFrame):
        #             persist_uid = uuid.uuid4()
        #             set_df_attr(local_ns[var_name], "", persist_uid)
        #             print(local_ns[var_name].attrs)
        #             dataframe_name_ids[persist_uid] = var_name

        PersistWidget(result, args.df_name)
