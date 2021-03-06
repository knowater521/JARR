import clsx from "clsx";
import React from "react";
import moment from "moment";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { createSelector } from "reselect";
// material ui components
import Link from "@material-ui/core/Link";
import Checkbox from "@material-ui/core/Checkbox";
import Typography from "@material-ui/core/Typography";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import CircularProgress from "@material-ui/core/CircularProgress";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
// material ui icons
import LikedIcon from "@material-ui/icons/Star";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import LikedIconBorder from "@material-ui/icons/StarBorder";
// jarr
import { removeClusterSelection, showCluster } from "../slice";
import doEditCluster from "../../../hooks/doEditCluster";
import doFetchCluster from "../../../hooks/doFetchCluster";
import makeStyles from "./style";
import { changeReadCount } from "../../feedlist/slice";
import ClusterIcon from "../../../components/ClusterIcon";
import Articles from "./Articles";

const getCluster = (state, props) => state.clusters.clusters[props.index];
const makeGetCluster = () => createSelector([ getCluster ], (cluster) => cluster);

const makeMapStateToProps = () => {
  const madeGetCluster = makeGetCluster();
  const mapStateToProps = (state, props) => {
    const cluster = madeGetCluster(state, props);
    return { expanded: cluster.id === state.clusters.requestedClusterId,
             unreadOnClose: !state.clusters.filters.filter,
             icons: state.feeds.icons,
             showContent: state.clusters.loadedCluster.id === cluster.id,
             cluster,
             doShow: showCluster(cluster, state.clusters.requestedClusterId,
                                 state.clusters.filters.filter),
    };
  };
  return mapStateToProps;
}

const mapDispatchToProps = (dispatch) => ({
  handleClickOnPanel(e, cluster, unreadOnClose, expanded) {
    if (!expanded) {
      // panel is folded, we fetch the cluster
      dispatch(doFetchCluster(cluster.id));
      dispatch(changeReadCount({
        feedsId: cluster["feeds_id"],
        categoriesId: cluster["categories_id"],
        action: "read" }));
    } else if (unreadOnClose) {
      // panel is expanded and the filters implies
      // we have to mark cluster as unread
      dispatch(removeClusterSelection());
      dispatch(doEditCluster(cluster.id,
                             { read: false, "read_reason": null }));
      dispatch(changeReadCount(
          { feedsId: cluster["feeds_id"],
            categoriesId: cluster["categories_id"],
            action: "unread" }));
    } else {
      // filters says everybody is displayed
      // so we"re not triggering changes in cluster list
      dispatch(removeClusterSelection());
    }
  },
  toggleRead(e, cluster) {
    e.stopPropagation();
    const payload = { feedsId: cluster["feeds_id"] };
    if (cluster.read && !e.target.checked) {
      dispatch(doEditCluster(cluster.id, { read: false, "read_reason": null }));
      dispatch(changeReadCount({ ...payload, action: "unread" }));
    } else if (!cluster.read && e.target.checked) {

      dispatch(doEditCluster(cluster.id, { read: true, "read_reason": "marked" }));
      dispatch(changeReadCount({ ...payload, action: "read" }));
    }
  },
  toggleLiked(e, clusterId) {
    e.stopPropagation();
    dispatch(doEditCluster(clusterId, { liked: e.target.checked }));
  },
  readOnRedirect(e, cluster) {
    e.stopPropagation();
    if (!cluster.read) {
      dispatch(doEditCluster(cluster.id,
                            { read: true, "read_reason": "consulted" }));
      dispatch(changeReadCount({
        feedsId: cluster["feeds_id"],
        categoriesId: cluster["categories_id"],
        action: "read" }));
    }
  },
});

const Cluster = ({ index, cluster, loadedCluster,
                   icons, doShow, expanded, showContent, unreadOnClose,
                   readOnRedirect, toggleRead, toggleLiked,
                   handleClickOnPanel, splitedMode,
}) => {
  const classes = makeStyles();
  if(!doShow) { return null; }
  let content;
  if(!splitedMode && expanded) {
    if (showContent) {
      content = <Articles />;
    } else {
      content = <div className={classes.loadingWrap}><CircularProgress /></div>;
    }
    content = (
      <ExpansionPanelDetails className={classes.content}
                             key={`cl-${cluster.id}`}>
        {content}
      </ExpansionPanelDetails>
    );
  }

  return (
      <ExpansionPanel
        expanded={expanded}
        elevation={expanded ? 10: 2}
        TransitionProps={{ unmountOnExit: true }}
        key={"c"
             + (expanded ? "e" : "")
             + (cluster.read ? "r" : "")
             + (cluster.liked ? "l" : "")
             + cluster.id}
        onChange={(e) => handleClickOnPanel(e, cluster,
                                            unreadOnClose, expanded)}
      >
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
          key={`cs-${cluster.id}`}
          className={classes.summary}
        >
          <div className={classes.link}>
            <Link href={cluster["main_link"]} target="_blank"
              aria-label="link to the resource"
              color="secondary"
              onFocus={(e) => e.stopPropagation()}
              onClick={(e) => readOnRedirect(e, cluster)}>
              {[ ...new Set(cluster["feeds_id"])].filter((feedId) => icons[feedId])
                      .map((feedId) => <ClusterIcon
                                          key={`i${cluster.id}f${feedId}`}
                                          iconUrl={icons[feedId]} />
                           )
              }
             {cluster["main_feed_title"]}
            </Link>
            <span className={classes.clusterDate}>{moment(cluster["main_date"]).fromNow()}</span>
          </div>
          <div>
            <Checkbox checked={cluster.read} key={`c${cluster.id}r`}
              className={classes.titleAction}
              name="read" size="small" color="primary"
              aria-label="toggle read"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onChange={(e) => toggleRead(e, cluster)} />
            <Checkbox checked={cluster.liked} key={`c${cluster.id}l`}
              className={classes.titleAction}
              name="liked" size="small" color="primary"
              aria-label="toggle read"
              icon={<LikedIconBorder />} checkedIcon={<LikedIcon />}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onChange={(e) => toggleLiked(e, cluster.id)} />
            <Typography
               className={clsx(classes.mainTitle, {[classes.mainTitleExpanded]: expanded})}>
             {cluster["main_title"]}
            </Typography>
          </div>
        </ExpansionPanelSummary>
        {content}
      </ExpansionPanel>
    );
};

Cluster.propTypes = {
  index: PropTypes.number.isRequired,
  cluster: PropTypes.shape({
    id: PropTypes.number.isRequired,
    read: PropTypes.bool.isRequired,
    liked: PropTypes.bool.isRequired,
    "feeds_id": PropTypes.array.isRequired,
    "categories_id": PropTypes.array.isRequired,
    "main_title": PropTypes.string.isRequired,
    "main_link": PropTypes.string.isRequired,
    "main_feed_title": PropTypes.string.isRequired,
    "main_date": PropTypes.string.isRequired,
  }),
  icons: PropTypes.object.isRequired,
  unreadOnClose: PropTypes.bool.isRequired,
  expanded: PropTypes.bool.isRequired,
  splitedMode: PropTypes.bool.isRequired,
  showContent: PropTypes.bool.isRequired,
  doShow: PropTypes.bool.isRequired,
  // funcs
  readOnRedirect: PropTypes.func.isRequired,
  toggleRead: PropTypes.func.isRequired,
  toggleLiked: PropTypes.func.isRequired,
  handleClickOnPanel: PropTypes.func.isRequired,
};

export default connect(makeMapStateToProps, mapDispatchToProps)(Cluster);
